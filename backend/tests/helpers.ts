import { randomUUID } from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

export interface TestAuthUser {
  id: string;
  name: string;
  email: string;
  accessToken: string;
}

export async function createTestApp(): Promise<FastifyInstance> {
  process.env.NODE_ENV = 'test';
  const app = await buildApp({ logger: false });
  await app.ready();
  return app;
}

export async function registerTestUser(
  app: FastifyInstance,
  tracker: string[],
  overrides?: Partial<{ name: string; email: string; password: string }>,
): Promise<TestAuthUser> {
  const unique = randomUUID().slice(0, 8);
  const name = overrides?.name ?? `Pengguna Tes ${unique}`;
  const email = overrides?.email ?? `test-${unique}@contoh.local`;
  const password = overrides?.password ?? 'rahasia123';

  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { name, email, password },
  });

  if (res.statusCode !== 201) {
    throw new Error(
      `Gagal mendaftarkan user tes (${res.statusCode}): ${res.body}`,
    );
  }

  const body = res.json<{
    user: { id: string; name: string; email: string };
    accessToken: string;
  }>();

  tracker.push(body.user.id);

  return {
    id: body.user.id,
    name: body.user.name,
    email: body.user.email,
    accessToken: body.accessToken,
  };
}

export async function cleanupTestUsers(userIds: string[]): Promise<void> {
  if (userIds.length === 0) {
    return;
  }

  await prisma.user.deleteMany({
    where: {
      id: { in: userIds },
    },
  });
}
