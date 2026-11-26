import { FastifyInstance } from 'fastify';
import {
  categoryBodySchema,
  categoryIdParamSchema,
} from '../schemas/category.schema';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../services/category.service';

export async function categoryRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/api/categories',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const categories = await listCategories(request.user.userId);
      return reply.status(200).send({ data: categories });
    },
  );

  app.post(
    '/api/categories',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const input = categoryBodySchema.parse(request.body);
      const category = await createCategory(request.user.userId, input);
      return reply.status(201).send({ data: category });
    },
  );

  app.patch(
    '/api/categories/:id',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const params = categoryIdParamSchema.parse(request.params);
      const input = categoryBodySchema.parse(request.body);
      const category = await updateCategory(
        request.user.userId,
        params.id,
        input,
      );
      return reply.status(200).send({ data: category });
    },
  );

  app.delete(
    '/api/categories/:id',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const params = categoryIdParamSchema.parse(request.params);
      await deleteCategory(request.user.userId, params.id);
      return reply.status(204).send();
    },
  );
}
