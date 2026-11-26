import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { createTestApp } from './helpers';

describe('Health & Fallback Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health mengembalikan 200 dengan status ok dan database connected', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{
      status: string;
      database: string;
      timestamp: string;
    }>();
    expect(body.status).toBe('ok');
    expect(body.database).toBe('connected');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it('GET /health mengembalikan 500 INTERNAL_SERVER_ERROR saat koneksi database gagal', async () => {
    const spy = vi
      .spyOn(prisma, '$queryRaw')
      .mockRejectedValueOnce(new Error('DB connection lost'));

    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    spy.mockRestore();

    expect(res.statusCode).toBe(500);
    const body = res.json<{ error: { code: string; message: string } }>();
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(body.error.message).toBeTruthy();
  });

  it('Endpoint tidak ditemukan mengembalikan 404 NOT_FOUND berformat seragam', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/tidak-ada',
    });

    expect(res.statusCode).toBe(404);
    const body = res.json<{ error: { code: string; message: string } }>();
    expect(body.error.code).toBe('NOT_FOUND');
  });
});
