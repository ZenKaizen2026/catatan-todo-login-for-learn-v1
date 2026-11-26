import { buildApp } from './app';
import { getEnv } from './lib/env';
import { prisma } from './lib/prisma';

async function start(): Promise<void> {
  const env = getEnv();
  const app = await buildApp();

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`Menerima sinyal ${signal}, menutup server...`);
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Server berjalan di http://localhost:${env.PORT}`);
  } catch (error) {
    app.log.error(error, 'Gagal menjalankan server');
    await prisma.$disconnect();
    process.exit(1);
  }
}

void start();
