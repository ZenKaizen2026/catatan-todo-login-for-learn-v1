import Fastify, { FastifyInstance } from 'fastify';
import { getEnv } from './lib/env';
import { registerAuthPlugin } from './plugins/auth';
import { registerCorsPlugin } from './plugins/cors';
import { registerErrorHandler } from './plugins/errorHandler';
import { authRoutes } from './routes/auth';
import { categoryRoutes } from './routes/categories';
import { healthRoutes } from './routes/health';
import { taskRoutes } from './routes/tasks';

export interface BuildAppOptions {
  logger?: boolean;
}

export async function buildApp(
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const env = getEnv();

  const app = Fastify({
    logger: options.logger ?? env.NODE_ENV !== 'test',
  });

  registerErrorHandler(app);
  await registerCorsPlugin(app);
  await registerAuthPlugin(app);

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(categoryRoutes);
  await app.register(taskRoutes);

  return app;
}
