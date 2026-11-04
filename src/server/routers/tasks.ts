import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { taskInputSchema, taskStatusSchema, taskUpdateSchema } from "@/lib/task-schema";
import {
  countTasks,
  createTask,
  deleteTask,
  getTask,
  listTasks,
  setTaskStatus,
  updateTask,
} from "../store";
import { publicProcedure, router } from "../trpc";

const idSchema = z.object({ id: z.string() });

function notFound(id: string) {
  return new TRPCError({ code: "NOT_FOUND", message: `Task ${id} not found` });
}

export const tasksRouter = router({
  list: publicProcedure
    .input(
      z.object({
        // nullish: useInfiniteQuery may send null for the first page.
        cursor: z.string().nullish(),
        limit: z.number().int().min(1).max(50).default(10),
        status: taskStatusSchema.default("pendente"),
      }),
    )
    .query(({ input }) => listTasks(input)),

  counts: publicProcedure.query(() => countTasks()),

  getById: publicProcedure.input(idSchema).query(({ input }) => {
    const task = getTask(input.id);
    if (!task) throw notFound(input.id);
    return task;
  }),

  create: publicProcedure.input(taskInputSchema).mutation(({ input }) => createTask(input)),

  update: publicProcedure
    .input(taskUpdateSchema)
    .mutation(({ input: { id, ...fields } }) => {
      const task = updateTask(id, fields);
      if (!task) throw notFound(id);
      return task;
    }),

  // Separate from update: completing or archiving shouldn't need to resend every field.
  setStatus: publicProcedure
    .input(idSchema.extend({ status: taskStatusSchema }))
    .mutation(({ input }) => {
      const task = setTaskStatus(input.id, input.status);
      if (!task) throw notFound(input.id);
      return task;
    }),

  delete: publicProcedure.input(idSchema).mutation(({ input }) => {
    if (!deleteTask(input.id)) throw notFound(input.id);
    return { id: input.id };
  }),
});
