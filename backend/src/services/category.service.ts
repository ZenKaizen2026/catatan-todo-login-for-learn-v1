import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { CategoryBodyInput } from '../schemas/category.schema';

export interface CategoryDto {
  id: string;
  name: string;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryWithCount {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    tasks: number;
  };
}

function toCategoryDto(category: CategoryWithCount): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    taskCount: category._count.tasks,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export async function listCategories(userId: string): Promise<CategoryDto[]> {
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });

  return categories.map(toCategoryDto);
}

export async function createCategory(
  userId: string,
  input: CategoryBodyInput,
): Promise<CategoryDto> {
  const duplicate = await prisma.category.findFirst({
    where: {
      userId,
      name: {
        equals: input.name,
        mode: 'insensitive',
      },
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new AppError(
      409,
      'CONFLICT',
      'Kategori dengan nama tersebut sudah ada.',
    );
  }

  const created = await prisma.category.create({
    data: {
      name: input.name,
      userId,
    },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });

  return toCategoryDto(created);
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  input: CategoryBodyInput,
): Promise<CategoryDto> {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, userId: true },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Kategori tidak ditemukan.');
  }

  if (existing.userId !== userId) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Anda tidak memiliki akses ke data ini.',
    );
  }

  const duplicate = await prisma.category.findFirst({
    where: {
      userId,
      id: { not: categoryId },
      name: {
        equals: input.name,
        mode: 'insensitive',
      },
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new AppError(
      409,
      'CONFLICT',
      'Kategori dengan nama tersebut sudah ada.',
    );
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: { name: input.name },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });

  return toCategoryDto(updated);
}

export async function deleteCategory(
  userId: string,
  categoryId: string,
): Promise<void> {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, userId: true },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Kategori tidak ditemukan.');
  }

  if (existing.userId !== userId) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Anda tidak memiliki akses ke data ini.',
    );
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });
}
