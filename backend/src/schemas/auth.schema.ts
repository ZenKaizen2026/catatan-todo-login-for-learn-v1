import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Nama wajib diisi.' })
    .trim()
    .min(1, 'Nama wajib diisi (1 sampai 100 karakter).')
    .max(100, 'Nama maksimal 100 karakter.'),
  email: z
    .string({ required_error: 'Email wajib diisi.' })
    .trim()
    .toLowerCase()
    .email('Format email tidak valid.')
    .max(255, 'Email maksimal 255 karakter.'),
  password: z
    .string({ required_error: 'Password wajib diisi.' })
    .min(8, 'Password minimal 8 karakter.')
    .max(100, 'Password maksimal 100 karakter.'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email wajib diisi.' })
    .trim()
    .toLowerCase()
    .email('Format email tidak valid.')
    .max(255, 'Email maksimal 255 karakter.'),
  password: z
    .string({ required_error: 'Password wajib diisi.' })
    .min(1, 'Password wajib diisi.')
    .max(100, 'Password maksimal 100 karakter.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
