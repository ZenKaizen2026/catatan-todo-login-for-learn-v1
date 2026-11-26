import { Prisma } from '@prisma/client';
import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError, formatErrorResponse } from '../lib/errors';

export function registerErrorHandler(app: FastifyInstance): void {
  app.setNotFoundHandler((_request: FastifyRequest, reply: FastifyReply) => {
    return reply
      .status(404)
      .send(formatErrorResponse('NOT_FOUND', 'Endpoint tidak ditemukan.'));
  });

  app.setErrorHandler(
    (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
      if (error instanceof AppError) {
        return reply
          .status(error.statusCode)
          .send(formatErrorResponse(error.code, error.message));
      }

      if (error instanceof ZodError) {
        const firstMessage =
          error.issues[0]?.message ?? 'Data yang dikirim tidak valid.';
        return reply
          .status(400)
          .send(formatErrorResponse('VALIDATION_ERROR', firstMessage));
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return reply
            .status(409)
            .send(formatErrorResponse('CONFLICT', 'Data sudah ada dan tidak boleh duplikat.'));
        }
      }

      const fastifyError = error as FastifyError;
      if (fastifyError.statusCode === 400 || fastifyError.validation) {
        return reply
          .status(400)
          .send(
            formatErrorResponse(
              'VALIDATION_ERROR',
              'Format permintaan tidak valid. Periksa kembali data JSON yang dikirim.',
            ),
          );
      }

      request.log.error(error, 'Terjadi kesalahan internal yang tidak terduga');
      return reply
        .status(500)
        .send(
          formatErrorResponse(
            'INTERNAL_SERVER_ERROR',
            'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
          ),
        );
    },
  );
}
