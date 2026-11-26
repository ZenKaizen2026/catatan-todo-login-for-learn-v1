import { randomUUID } from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupTestUsers, createTestApp } from './helpers';

describe('Auth Endpoints (/api/auth/*)', () => {
  let app: FastifyInstance;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestUsers(createdUserIds);
    await app.close();
  });

  it('POST /api/auth/register berhasil mendaftarkan user baru dan mengembalikan 201 + JWT', async () => {
    const email = `Budi.${randomUUID().slice(0, 8)}@Contoh.LOCAL`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Budi Santoso',
        email,
        password: 'password123',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json<{
      user: {
        id: string;
        name: string;
        email: string;
        createdAt: string;
        passwordHash?: string;
      };
      accessToken: string;
    }>();

    createdUserIds.push(body.user.id);

    expect(body.user.name).toBe('Budi Santoso');
    expect(body.user.email).toBe(email.toLowerCase());
    expect(body.user.passwordHash).toBeUndefined();
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(20);
  });

  it('POST /api/auth/register mengembalikan 400 VALIDATION_ERROR untuk password terlalu pendek', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Budi',
        email: `pendek-${randomUUID().slice(0, 8)}@contoh.local`,
        password: '123',
      },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string; message: string } }>();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/auth/register mengembalikan 409 CONFLICT jika email sudah terdaftar (case-insensitive)', async () => {
    const email = `duplikat-${randomUUID().slice(0, 8)}@contoh.local`;

    const first = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'User Satu',
        email,
        password: 'password123',
      },
    });
    expect(first.statusCode).toBe(201);
    createdUserIds.push(first.json<{ user: { id: string } }>().user.id);

    const second = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'User Dua',
        email: email.toUpperCase(),
        password: 'password123',
      },
    });

    expect(second.statusCode).toBe(409);
    const body = second.json<{ error: { code: string; message: string } }>();
    expect(body.error.code).toBe('CONFLICT');
  });

  it('POST /api/auth/login berhasil (200) dan gagal tidak membocorkan mana yang salah (401)', async () => {
    const email = `login-${randomUUID().slice(0, 8)}@contoh.local`;
    const reg = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Pengguna Login',
        email,
        password: 'password123',
      },
    });
    expect(reg.statusCode).toBe(201);
    createdUserIds.push(reg.json<{ user: { id: string } }>().user.id);

    const okRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'password123' },
    });
    expect(okRes.statusCode).toBe(200);
    const okBody = okRes.json<{
      user: { email: string };
      accessToken: string;
    }>();
    expect(okBody.user.email).toBe(email);
    expect(okBody.accessToken).toBeTruthy();

    const wrongPassRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'password-salah' },
    });
    const wrongEmailRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'tidak-ada@contoh.local', password: 'password123' },
    });

    expect(wrongPassRes.statusCode).toBe(401);
    expect(wrongEmailRes.statusCode).toBe(401);

    const wrongPassBody = wrongPassRes.json<{
      error: { code: string; message: string };
    }>();
    const wrongEmailBody = wrongEmailRes.json<{
      error: { code: string; message: string };
    }>();

    expect(wrongPassBody.error.code).toBe('INVALID_CREDENTIALS');
    expect(wrongEmailBody.error.code).toBe('INVALID_CREDENTIALS');
    expect(wrongPassBody.error.message).toBe(wrongEmailBody.error.message);
  });

  it('GET /api/auth/me sukses dengan token valid (200) dan gagal saat token hilang/invalid/expired (401)', async () => {
    const email = `me-${randomUUID().slice(0, 8)}@contoh.local`;
    const reg = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Pengguna Me',
        email,
        password: 'password123',
      },
    });
    const { user, accessToken } = reg.json<{
      user: { id: string; email: string };
      accessToken: string;
    }>();
    createdUserIds.push(user.id);

    const okRes = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(okRes.statusCode).toBe(200);
    expect(okRes.json<{ user: { id: string } }>().user.id).toBe(user.id);

    const missingRes = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
    });
    expect(missingRes.statusCode).toBe(401);
    expect(missingRes.json<{ error: { code: string } }>().error.code).toBe(
      'UNAUTHORIZED',
    );

    const invalidRes = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: 'Bearer token.tidak.valid' },
    });
    expect(invalidRes.statusCode).toBe(401);
    expect(invalidRes.json<{ error: { code: string } }>().error.code).toBe(
      'UNAUTHORIZED',
    );

    const expiredToken = app.jwt.sign(
      { userId: user.id, email: user.email },
      { clockTimestamp: Date.now() - 10_000, expiresIn: '1s' },
    );
    const expiredRes = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${expiredToken}` },
    });
    expect(expiredRes.statusCode).toBe(401);
    expect(expiredRes.json<{ error: { code: string } }>().error.code).toBe(
      'UNAUTHORIZED',
    );
  });

  it('POST /api/auth/logout sukses dengan token valid (200) dan gagal tanpa token (401)', async () => {
    const email = `logout-${randomUUID().slice(0, 8)}@contoh.local`;
    const reg = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Pengguna Logout',
        email,
        password: 'password123',
      },
    });
    const { user, accessToken } = reg.json<{
      user: { id: string };
      accessToken: string;
    }>();
    createdUserIds.push(user.id);

    const okRes = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(okRes.statusCode).toBe(200);
    expect(okRes.json<{ message: string }>().message).toBeTruthy();

    const failRes = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
    });
    expect(failRes.statusCode).toBe(401);
    expect(failRes.json<{ error: { code: string } }>().error.code).toBe(
      'UNAUTHORIZED',
    );
  });
});
