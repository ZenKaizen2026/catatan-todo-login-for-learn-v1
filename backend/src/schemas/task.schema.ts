import { z } from 'zod';

export const taskStatusSchema = z.enum(['todo', 'doing', 'done'], {
  errorMap: () => ({ message: 'Status tugas harus salah satu dari: todo, doing, done.' }),
});

export const taskPrioritySchema = z.enum(['rendah', 'sedang', 'tinggi'], {
  errorMap: () => ({ message: 'Prioritas tugas harus salah satu dari: rendah, sedang, tinggi.' }),
});

export const taskIdParamSchema = z.object({
  id: z.string().uuid('Format ID tugas tidak valid.'),
});

export const listTasksQuerySchema = z.object({
  page: z.coerce
    .number({ invalid_type_error: 'Parameter page harus berupa angka.' })
    .int('Parameter page harus berupa bilangan bulat.')
    .min(1, 'Parameter page minimal 1.')
    .default(1),
  limit: z.coerce
    .number({ invalid_type_error: 'Parameter limit harus berupa angka.' })
    .int('Parameter limit harus berupa bilangan bulat.')
    .min(1, 'Parameter limit minimal 1.')
    .max(50, 'Parameter limit maksimal 50.')
    .default(10),
  q: z.string().trim().max(120, 'Kata kunci pencarian maksimal 120 karakter.').optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  categoryId: z.string().uuid('Format categoryId tidak valid.').optional(),
});

const isoDateTimeSchema = z
  .string()
  .datetime({ offset: true, message: 'Format tanggal tenggat harus ISO 8601 yang valid.' });

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Judul tugas wajib diisi.' })
    .trim()
    .min(1, 'Judul tugas wajib diisi (1 sampai 120 karakter).')
    .max(120, 'Judul tugas maksimal 120 karakter.'),
  description: z
    .string()
    .max(1000, 'Deskripsi tugas maksimal 1000 karakter.')
    .nullable()
    .optional(),
  priority: taskPrioritySchema.default('sedang'),
  dueDate: isoDateTimeSchema.nullable().optional(),
  categoryId: z.string().uuid('Format categoryId tidak valid.').nullable().optional(),
});

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Judul tugas wajib diisi (1 sampai 120 karakter).')
      .max(120, 'Judul tugas maksimal 120 karakter.')
      .optional(),
    description: z
      .string()
      .max(1000, 'Deskripsi tugas maksimal 1000 karakter.')
      .nullable()
      .optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    dueDate: isoDateTimeSchema.nullable().optional(),
    categoryId: z.string().uuid('Format categoryId tidak valid.').nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus dikirim untuk diperbarui.',
  });

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
