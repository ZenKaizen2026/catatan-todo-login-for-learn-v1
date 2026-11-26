import { FastifyInstance } from 'fastify';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { getUserById, loginUser, registerUser } from '../services/auth.service';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/register', async (request, reply) => {
    const input = registerSchema.parse(request.body);
    const user = await registerUser(input);
    const accessToken = app.jwt.sign({
      userId: user.id,
      email: user.email,
    });

    return reply.status(201).send({
      user,
      accessToken,
    });
  });

  app.post('/api/auth/login', async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const user = await loginUser(input);
    const accessToken = app.jwt.sign({
      userId: user.id,
      email: user.email,
    });

    return reply.status(200).send({
      user,
      accessToken,
    });
  });

  app.post(
    '/api/auth/logout',
    { preHandler: [app.authenticate] },
    async (_request, reply) => {
      return reply.status(200).send({
        message: 'Anda berhasil keluar dari akun.',
      });
    },
  );

  app.get(
    '/api/auth/me',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = await getUserById(request.user.userId);
      return reply.status(200).send({ user });
    },
  );
}
