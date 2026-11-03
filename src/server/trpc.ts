import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";

const t = initTRPC.create({
  // By default a Zod failure reaches the client as a JSON string of issues.
  // Sending the first issue's message gives the UI something it can show as is.
  errorFormatter({ shape, error }) {
    if (error.cause instanceof ZodError) {
      return { ...shape, message: error.cause.issues[0]?.message ?? shape.message };
    }
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
