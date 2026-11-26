import { AppError } from '../lib/errors';
import { hashPassword, verifyPassword } from '../lib/password';
import { prisma } from '../lib/prisma';
import { LoginInput, RegisterInput } from '../schemas/auth.schema';

export interface UserDto {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

function toUserDto(user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function registerUser(input: RegisterInput): Promise<UserDto> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError(
      409,
      'CONFLICT',
      'Email sudah terdaftar. Silakan gunakan email lain atau login.',
    );
  }

  const passwordHash = await hashPassword(input.password);

  const createdUser = await prisma.user.create({
    data: {
      name: input.name,
      email: normalizedEmail,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return toUserDto(createdUser);
}

export async function loginUser(input: LoginInput): Promise<UserDto> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email atau password salah.');
  }

  const isPasswordValid = await verifyPassword(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email atau password salah.');
  }

  return toUserDto(user);
}

export async function getUserById(userId: string): Promise<UserDto> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(
      401,
      'UNAUTHORIZED',
      'Sesi Anda telah berakhir. Silakan login kembali.',
    );
  }

  return toUserDto(user);
}
