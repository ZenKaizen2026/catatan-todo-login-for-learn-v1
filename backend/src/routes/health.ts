import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_request, reply) => {
    await prisma.$queryRaw`SELECT 1`;

    return reply.status(200).send({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  });
}
