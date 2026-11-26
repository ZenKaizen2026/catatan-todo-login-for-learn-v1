import 'dotenv/config';
import { PrismaClient, TaskPriority, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_USER_EMAIL = 'demo@contoh.id';
const DEMO_USER_NAME = 'Budi Demo';
const DEMO_USER_PASSWORD = 'password123';

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_USER_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {
      name: DEMO_USER_NAME,
    },
    create: {
      name: DEMO_USER_NAME,
      email: DEMO_USER_EMAIL,
      passwordHash,
    },
  });

  const categoryNames = ['Kuliah', 'Proyek', 'Pribadi'] as const;
  const categoryMap = new Map<string, string>();

  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name,
        },
      },
      update: {},
      create: {
        name,
        userId: user.id,
      },
    });
    categoryMap.set(name, category.id);
  }

  const seedTasks: Array<{
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date | null;
    categoryName: string | null;
  }> = [
    {
      title: 'Pelajari cara kerja JWT dan bcrypt',
      description: 'Catat alur login dari form frontend sampai verifikasi token di backend.',
      status: TaskStatus.doing,
      priority: TaskPriority.tinggi,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      categoryName: 'Kuliah',
    },
    {
      title: 'Selesaikan laporan praktikum basis data',
      description: 'Tambahkan ERD dan hasil uji query index pada PostgreSQL.',
      status: TaskStatus.todo,
      priority: TaskPriority.tinggi,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      categoryName: 'Kuliah',
    },
    {
      title: 'Rapikan struktur endpoint REST API',
      description: 'Pastikan semua response sesuai kontrak docs/openapi.yaml.',
      status: TaskStatus.done,
      priority: TaskPriority.sedang,
      dueDate: null,
      categoryName: 'Proyek',
    },
    {
      title: 'Beli pulsa dan bayar listrik kos',
      description: null,
      status: TaskStatus.todo,
      priority: TaskPriority.rendah,
      dueDate: null,
      categoryName: null,
    },
  ];

  for (const item of seedTasks) {
    const existing = await prisma.task.findFirst({
      where: {
        userId: user.id,
        title: item.title,
      },
    });

    if (!existing) {
      await prisma.task.create({
        data: {
          title: item.title,
          description: item.description,
          status: item.status,
          priority: item.priority,
          dueDate: item.dueDate,
          userId: user.id,
          categoryId: item.categoryName ? (categoryMap.get(item.categoryName) ?? null) : null,
        },
      });
    }
  }

  console.log(
    `Seed selesai: user=${user.email}, categories=${categoryNames.length}, sampleTasks=${seedTasks.length}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Seed gagal:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
