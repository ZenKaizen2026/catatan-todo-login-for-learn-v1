import { FastifyInstance } from 'fastify';
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamSchema,
  updateTaskSchema,
} from '../schemas/task.schema';
import {
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask,
} from '../services/task.service';

export async function taskRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/api/tasks',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const query = listTasksQuerySchema.parse(request.query);
      const result = await listTasks(request.user.userId, query);
      return reply.status(200).send(result);
    },
  );

  app.post(
    '/api/tasks',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const input = createTaskSchema.parse(request.body);
      const task = await createTask(request.user.userId, input);
      return reply.status(201).send({ data: task });
    },
  );

  app.get(
    '/api/tasks/:id',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const params = taskIdParamSchema.parse(request.params);
      const task = await getTaskById(request.user.userId, params.id);
      return reply.status(200).send({ data: task });
    },
  );

  app.patch(
    '/api/tasks/:id',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const params = taskIdParamSchema.parse(request.params);
      const input = updateTaskSchema.parse(request.body);
      const task = await updateTask(request.user.userId, params.id, input);
      return reply.status(200).send({ data: task });
    },
  );

  app.delete(
    '/api/tasks/:id',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const params = taskIdParamSchema.parse(request.params);
      await deleteTask(request.user.userId, params.id);
      return reply.status(204).send();
    },
  );
}
