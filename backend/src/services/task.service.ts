import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import {
  CreateTaskInput,
  ListTasksQuery,
  UpdateTaskInput,
} from '../schemas/task.schema';

export interface CategorySummaryDto {
  id: string;
  name: string;
}

export interface TaskDto {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  categoryId: string | null;
  category: CategorySummaryDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMetaDto {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface TaskListResult {
  data: TaskDto[];
  meta: PaginationMetaDto;
}

const taskInclude = {
  category: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.TaskInclude;

type TaskWithCategory = Prisma.TaskGetPayload<{
  include: typeof taskInclude;
}>;

function toTaskDto(task: TaskWithCategory): TaskDto {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    categoryId: task.categoryId,
    category: task.category
      ? {
          id: task.category.id,
          name: task.category.name,
        }
      : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

async function assertCategoryOwnership(
  userId: string,
  categoryId: string,
): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, userId: true },
  });

  if (!category) {
    throw new AppError(404, 'NOT_FOUND', 'Kategori tidak ditemukan.');
  }

  if (category.userId !== userId) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Anda tidak memiliki akses ke data ini.',
    );
  }
}

export async function listTasks(
  userId: string,
  query: ListTasksQuery,
): Promise<TaskListResult> {
  const where: Prisma.TaskWhereInput = {
    userId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.q && query.q.length > 0
      ? {
          title: {
            contains: query.q,
            mode: 'insensitive',
          },
        }
      : {}),
  };

  const skip = (query.page - 1) * query.limit;

  const [tasks, totalItems] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
      include: taskInclude,
    }),
    prisma.task.count({ where }),
  ]);

  const totalPages =
    totalItems === 0 ? 0 : Math.ceil(totalItems / query.limit);

  return {
    data: tasks.map(toTaskDto),
    meta: {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages,
    },
  };
}

export async function createTask(
  userId: string,
  input: CreateTaskInput,
): Promise<TaskDto> {
  if (input.categoryId) {
    await assertCategoryOwnership(userId, input.categoryId);
  }

  const created = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      status: TaskStatus.todo,
      priority: input.priority,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      userId,
      categoryId: input.categoryId ?? null,
    },
    include: taskInclude,
  });

  return toTaskDto(created);
}

export async function getTaskById(
  userId: string,
  taskId: string,
): Promise<TaskDto> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: taskInclude,
  });

  if (!task) {
    throw new AppError(404, 'NOT_FOUND', 'Tugas tidak ditemukan.');
  }

  if (task.userId !== userId) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Anda tidak memiliki akses ke data ini.',
    );
  }

  return toTaskDto(task);
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<TaskDto> {
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, userId: true },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Tugas tidak ditemukan.');
  }

  if (existing.userId !== userId) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Anda tidak memiliki akses ke data ini.',
    );
  }

  if (input.categoryId !== undefined && input.categoryId !== null) {
    await assertCategoryOwnership(userId, input.categoryId);
  }

  const updateData: Prisma.TaskUncheckedUpdateInput = {};
  if (input.title !== undefined) {
    updateData.title = input.title;
  }
  if (input.description !== undefined) {
    updateData.description = input.description;
  }
  if (input.status !== undefined) {
    updateData.status = input.status;
  }
  if (input.priority !== undefined) {
    updateData.priority = input.priority;
  }
  if (input.dueDate !== undefined) {
    updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }
  if (input.categoryId !== undefined) {
    updateData.categoryId = input.categoryId;
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: taskInclude,
  });

  return toTaskDto(updated);
}

export async function deleteTask(
  userId: string,
  taskId: string,
): Promise<void> {
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, userId: true },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Tugas tidak ditemukan.');
  }

  if (existing.userId !== userId) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Anda tidak memiliki akses ke data ini.',
    );
  }

  await prisma.task.delete({
    where: { id: taskId },
  });
}
