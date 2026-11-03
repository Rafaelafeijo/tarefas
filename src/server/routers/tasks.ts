import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { taskInputSchema } from "@/lib/task-schema";
import { createTask, deleteTask, getTask, listTasks, updateTask } from "../store";
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
      }),
    )
    .query(({ input }) => listTasks(input)),

  getById: publicProcedure.input(idSchema).query(({ input }) => {
    const task = getTask(input.id);
    if (!task) throw notFound(input.id);
    return task;
  }),

  create: publicProcedure.input(taskInputSchema).mutation(({ input }) => createTask(input)),

  update: publicProcedure
    .input(taskInputSchema.extend(idSchema.shape))
    .mutation(({ input: { id, ...fields } }) => {
      const task = updateTask(id, fields);
      if (!task) throw notFound(id);
      return task;
    }),

  delete: publicProcedure.input(idSchema).mutation(({ input }) => {
    if (!deleteTask(input.id)) throw notFound(input.id);
    return { id: input.id };
  }),
});
