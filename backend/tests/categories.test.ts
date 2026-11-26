import { randomUUID } from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  cleanupTestUsers,
  createTestApp,
  registerTestUser,
  TestAuthUser,
} from './helpers';

describe('Categories Endpoints (/api/categories/*)', () => {
  let app: FastifyInstance;
  let userA: TestAuthUser;
  let userB: TestAuthUser;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    userA = await registerTestUser(app, createdUserIds, { name: 'User Cat A' });
    userB = await registerTestUser(app, createdUserIds, { name: 'User Cat B' });
  });

  afterAll(async () => {
    await cleanupTestUsers(createdUserIds);
    await app.close();
  });

  it('POST /api/categories berhasil membuat kategori (201) dan menolak duplikat case-insensitive (409) serta input kosong (400)', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { name: 'Kuliah' },
    });

    expect(createRes.statusCode).toBe(201);
    const created = createRes.json<{
      data: { id: string; name: string; taskCount: number };
    }>();
    expect(created.data.name).toBe('Kuliah');
    expect(created.data.taskCount).toBe(0);

    const dupRes = await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { name: 'kuliah' },
    });
    expect(dupRes.statusCode).toBe(409);
    expect(dupRes.json<{ error: { code: string } }>().error.code).toBe(
      'CONFLICT',
    );

    const invalidRes = await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { name: '   ' },
    });
    expect(invalidRes.statusCode).toBe(400);
    expect(invalidRes.json<{ error: { code: string } }>().error.code).toBe(
      'VALIDATION_ERROR',
    );

    const unauthRes = await app.inject({
      method: 'POST',
      url: '/api/categories',
      payload: { name: 'Tanpa Login' },
    });
    expect(unauthRes.statusCode).toBe(401);
  });

  it('GET /api/categories mengembalikan kategori alfabetis dengan taskCount dan terisolasi per user', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { name: 'Arsip' },
    });

    await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers: { authorization: `Bearer ${userB.accessToken}` },
      payload: { name: 'Kategori User B' },
    });

    const listRes = await app.inject({
      method: 'GET',
      url: '/api/categories',
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(listRes.statusCode).toBe(200);
    const body = listRes.json<{
      data: Array<{ id: string; name: string; taskCount: number }>;
    }>();

    const names = body.data.map((c) => c.name);
    expect(names).toEqual(['Arsip', 'Kuliah']);
    expect(names).not.toContain('Kategori User B');

    const unauthRes = await app.inject({
      method: 'GET',
      url: '/api/categories',
    });
    expect(unauthRes.statusCode).toBe(401);
  });

  it('PATCH /api/categories/:id berhasil ubah nama (200), 409 jika duplikat, 403 milik user lain, 404 tidak ada', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { name: 'Proyek Lama' },
    });
    const catId = createRes.json<{ data: { id: string } }>().data.id;

    const patchOk = await app.inject({
      method: 'PATCH',
      url: `/api/categories/${catId}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { name: 'Proyek Baru' },
    });
    expect(patchOk.statusCode).toBe(200);
    expect(patchOk.json<{ data: { name: string } }>().data.name).toBe(
      'Proyek Baru',
    );

    const patchDup = await app.inject({
      method: 'PATCH',
      url: `/api/categories/${catId}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { name: 'KULIAH' },
    });
    expect(patchDup.statusCode).toBe(409);

    const patchForbidden = await app.inject({
      method: 'PATCH',
      url: `/api/categories/${catId}`,
      headers: { authorization: `Bearer ${userB.accessToken}` },
      payload: { name: 'Bajak Kategori' },
    });
    expect(patchForbidden.statusCode).toBe(403);
    expect(patchForbidden.json<{ error: { code: string } }>().error.code).toBe(
      'FORBIDDEN',
    );

    const patchNotFound = await app.inject({
      method: 'PATCH',
      url: `/api/categories/${randomUUID()}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { name: 'Tidak Ada' },
    });
    expect(patchNotFound.statusCode).toBe(404);
    expect(patchNotFound.json<{ error: { code: string } }>().error.code).toBe(
      'NOT_FOUND',
    );
  });

  it('DELETE /api/categories/:id menghapus kategori (204) tanpa menghapus tugas (categoryId -> null), serta cek 403/404', async () => {
    const createCatRes = await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { name: 'Sementara' },
    });
    const catId = createCatRes.json<{ data: { id: string } }>().data.id;

    const createTaskRes = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: {
        title: 'Tugas dengan kategori yang akan dihapus',
        categoryId: catId,
      },
    });
    expect(createTaskRes.statusCode).toBe(201);
    const taskId = createTaskRes.json<{ data: { id: string } }>().data.id;

    const delForbidden = await app.inject({
      method: 'DELETE',
      url: `/api/categories/${catId}`,
      headers: { authorization: `Bearer ${userB.accessToken}` },
    });
    expect(delForbidden.statusCode).toBe(403);
    expect(delForbidden.json<{ error: { code: string } }>().error.code).toBe(
      'FORBIDDEN',
    );

    const delOk = await app.inject({
      method: 'DELETE',
      url: `/api/categories/${catId}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(delOk.statusCode).toBe(204);

    const taskAfterRes = await app.inject({
      method: 'GET',
      url: `/api/tasks/${taskId}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(taskAfterRes.statusCode).toBe(200);
    const taskAfter = taskAfterRes.json<{
      data: { id: string; categoryId: string | null; category: unknown };
    }>();
    expect(taskAfter.data.id).toBe(taskId);
    expect(taskAfter.data.categoryId).toBeNull();
    expect(taskAfter.data.category).toBeNull();

    const delNotFound = await app.inject({
      method: 'DELETE',
      url: `/api/categories/${catId}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(delNotFound.statusCode).toBe(404);
  });
});
