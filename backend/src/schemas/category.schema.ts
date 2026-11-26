import { z } from 'zod';

export const categoryIdParamSchema = z.object({
  id: z.string().uuid('Format ID kategori tidak valid.'),
});

export const categoryBodySchema = z.object({
  name: z
    .string({ required_error: 'Nama kategori wajib diisi.' })
    .trim()
    .min(1, 'Nama kategori wajib diisi (1 sampai 50 karakter).')
    .max(50, 'Nama kategori maksimal 50 karakter.'),
});

export type CategoryBodyInput = z.infer<typeof categoryBodySchema>;
