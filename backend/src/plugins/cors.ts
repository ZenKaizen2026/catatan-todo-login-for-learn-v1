import fastifyCors from '@fastify/cors';
import { FastifyInstance } from 'fastify';
import { getEnv } from '../lib/env';

export async function registerCorsPlugin(app: FastifyInstance): Promise<void> {
  const env = getEnv();
  const allowedOrigins = env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  await app.register(fastifyCors, {
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}
