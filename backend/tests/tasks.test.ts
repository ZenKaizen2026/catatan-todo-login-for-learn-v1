import { randomUUID } from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  cleanupTestUsers,
  createTestApp,
  registerTestUser,
  TestAuthUser,
} from './helpers';

interface TaskPayload {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'doing' | 'done';
  priority: 'rendah' | 'sedang' | 'tinggi';
  dueDate: string | null;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

describe('Tasks Endpoints (/api/tasks/*)', () => {
  let app: FastifyInstance;
  let userA: TestAuthUser;
  let userB: TestAuthUser;
  let catAId: string;
  let catBId: string;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    userA = await registerTestUser(app, createdUserIds, {
      name: 'User Task A',
    });
    userB = await registerTestUser(app, createdUserIds, {
      name: 'User Task B',
    });

    const catARes = await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { name: 'Kuliah' },
    });
    catAId = catARes.json<{ data: { id: string } }>().data.id;

    const catBRes = await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers: { authorization: `Bearer ${userB.accessToken}` },
      payload: { name: 'Rahasia B' },
    });
    catBId = catBRes.json<{ data: { id: string } }>().data.id;
  });

  afterAll(async () => {
    await cleanupTestUsers(createdUserIds);
    await app.close();
  });

  it('POST /api/tasks membuat tugas (201) dengan default status/priority, menolak 400/403/404/401', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: {
        title: 'Belajar Fastify & Prisma',
        description: 'Implementasi semua endpoint sesuai OpenAPI',
        dueDate: '2026-12-01T12:00:00.000Z',
        categoryId: catAId,
      },
    });

    expect(createRes.statusCode).toBe(201);
    const body = createRes.json<{ data: TaskPayload }>();
    expect(body.data.title).toBe('Belajar Fastify & Prisma');
    expect(body.data.status).toBe('todo');
    expect(body.data.priority).toBe('sedang');
    expect(body.data.categoryId).toBe(catAId);
    expect(body.data.category).toEqual({ id: catAId, name: 'Kuliah' });

    const invalidRes = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { title: '' },
    });
    expect(invalidRes.statusCode).toBe(400);
    expect(invalidRes.json<{ error: { code: string } }>().error.code).toBe(
      'VALIDATION_ERROR',
    );

    const forbiddenCatRes = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: {
        title: 'Pakai kategori user lain',
        categoryId: catBId,
      },
    });
    expect(forbiddenCatRes.statusCode).toBe(403);
    expect(forbiddenCatRes.json<{ error: { code: string } }>().error.code).toBe(
      'FORBIDDEN',
    );

    const missingCatRes = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: {
        title: 'Pakai kategori fiktif',
        categoryId: randomUUID(),
      },
    });
    expect(missingCatRes.statusCode).toBe(404);
    expect(missingCatRes.json<{ error: { code: string } }>().error.code).toBe(
      'NOT_FOUND',
    );

    const unauthRes = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      payload: { title: 'Tanpa token' },
    });
    expect(unauthRes.statusCode).toBe(401);
  });

  it('GET /api/tasks mendukung search, filter status/priority/categoryId, pagination, dan validasi query', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: {
        title: 'Laporan Praktikum Jaringan',
        priority: 'tinggi',
        categoryId: catAId,
      },
    });

    const task3Res = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: {
        title: 'Beli buku catatan',
        priority: 'rendah',
      },
    });
    const task3Id = task3Res.json<{ data: { id: string } }>().data.id;

    await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${task3Id}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { status: 'done' },
    });

    await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: { authorization: `Bearer ${userB.accessToken}` },
      payload: { title: 'Tugas pribadi user B' },
    });

    const page1Res = await app.inject({
      method: 'GET',
      url: '/api/tasks?page=1&limit=2',
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(page1Res.statusCode).toBe(200);
    const page1 = page1Res.json<{
      data: TaskPayload[];
      meta: { page: number; limit: number; totalItems: number; totalPages: number };
    }>();
    expect(page1.data).toHaveLength(2);
    expect(page1.meta.page).toBe(1);
    expect(page1.meta.limit).toBe(2);
    expect(page1.meta.totalItems).toBeGreaterThanOrEqual(3);
    expect(page1.meta.totalPages).toBe(Math.ceil(page1.meta.totalItems / 2));

    const searchRes = await app.inject({
      method: 'GET',
      url: '/api/tasks?q=praktikum',
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(searchRes.statusCode).toBe(200);
    const searchBody = searchRes.json<{ data: TaskPayload[] }>();
    expect(searchBody.data).toHaveLength(1);
    expect(searchBody.data[0]?.title).toBe('Laporan Praktikum Jaringan');

    const filterRes = await app.inject({
      method: 'GET',
      url: `/api/tasks?status=done&priority=rendah`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(filterRes.statusCode).toBe(200);
    const filterBody = filterRes.json<{ data: TaskPayload[] }>();
    expect(filterBody.data).toHaveLength(1);
    expect(filterBody.data[0]?.id).toBe(task3Id);

    const catFilterRes = await app.inject({
      method: 'GET',
      url: `/api/tasks?categoryId=${catAId}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(catFilterRes.statusCode).toBe(200);
    expect(
      catFilterRes
        .json<{ data: TaskPayload[] }>()
        .data.every((t) => t.categoryId === catAId),
    ).toBe(true);

    const badQueryRes = await app.inject({
      method: 'GET',
      url: '/api/tasks?limit=100',
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(badQueryRes.statusCode).toBe(400);
    expect(badQueryRes.json<{ error: { code: string } }>().error.code).toBe(
      'VALIDATION_ERROR',
    );
  });

  it('GET /api/tasks/:id, PATCH /api/tasks/:id, dan DELETE /api/tasks/:id menegakkan 200/204, 400, 403, dan 404', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: {
        title: 'Tugas CRUD Lengkap',
        description: 'Deskripsi awal',
        dueDate: '2026-12-10T10:00:00.000Z',
        categoryId: catAId,
      },
    });
    const taskId = createRes.json<{ data: { id: string } }>().data.id;

    // GET sukses
    const getOk = await app.inject({
      method: 'GET',
      url: `/api/tasks/${taskId}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(getOk.statusCode).toBe(200);
    expect(getOk.json<{ data: TaskPayload }>().data.id).toBe(taskId);

    // GET 403 oleh user B
    const getForbidden = await app.inject({
      method: 'GET',
      url: `/api/tasks/${taskId}`,
      headers: { authorization: `Bearer ${userB.accessToken}` },
    });
    expect(getForbidden.statusCode).toBe(403);
    expect(getForbidden.json<{ error: { code: string } }>().error.code).toBe(
      'FORBIDDEN',
    );

    // GET 404 tidak ditemukan & 400 UUID tidak valid
    const getNotFound = await app.inject({
      method: 'GET',
      url: `/api/tasks/${randomUUID()}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(getNotFound.statusCode).toBe(404);

    const getBadId = await app.inject({
      method: 'GET',
      url: '/api/tasks/bukan-uuid',
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(getBadId.statusCode).toBe(400);

    // PATCH sukses: ubah status maju, lalu mundur + kosongkan nullable fields
    const patchDoing = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${taskId}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { status: 'doing', priority: 'tinggi' },
    });
    expect(patchDoing.statusCode).toBe(200);
    expect(patchDoing.json<{ data: TaskPayload }>().data.status).toBe('doing');

    const patchReset = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${taskId}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: {
        status: 'todo',
        description: null,
        dueDate: null,
        categoryId: null,
      },
    });
    expect(patchReset.statusCode).toBe(200);
    const resetTask = patchReset.json<{ data: TaskPayload }>().data;
    expect(resetTask.status).toBe('todo');
    expect(resetTask.description).toBeNull();
    expect(resetTask.dueDate).toBeNull();
    expect(resetTask.categoryId).toBeNull();
    expect(resetTask.category).toBeNull();

    // PATCH gagal: body kosong (400), milik user lain (403), kategori milik user lain (403)
    const patchEmpty = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${taskId}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: {},
    });
    expect(patchEmpty.statusCode).toBe(400);

    const patchForbidden = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${taskId}`,
      headers: { authorization: `Bearer ${userB.accessToken}` },
      payload: { title: 'Bajak tugas' },
    });
    expect(patchForbidden.statusCode).toBe(403);

    const patchForeignCat = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${taskId}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { categoryId: catBId },
    });
    expect(patchForeignCat.statusCode).toBe(403);

    // DELETE 403 oleh user B
    const delForbidden = await app.inject({
      method: 'DELETE',
      url: `/api/tasks/${taskId}`,
      headers: { authorization: `Bearer ${userB.accessToken}` },
    });
    expect(delForbidden.statusCode).toBe(403);

    // DELETE 204 oleh user A
    const delOk = await app.inject({
      method: 'DELETE',
      url: `/api/tasks/${taskId}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(delOk.statusCode).toBe(204);

    // Setelah dihapus -> GET & DELETE jadi 404
    const afterDelGet = await app.inject({
      method: 'GET',
      url: `/api/tasks/${taskId}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(afterDelGet.statusCode).toBe(404);
  });
});
