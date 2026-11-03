import { z } from "zod";

// Lives outside the router so the browser bundle can import it without pulling
// in server code. Same schema on both sides: the form can't disagree with the API.
export const taskInputSchema = z.object({
  // trim() first, so a title made only of spaces counts as empty.
  // `error` covers the field being absent altogether, not just empty.
  titulo: z.string({ error: "Title is required" }).trim().min(1, "Title is required"),
  descricao: z.string().trim().optional(),
});

export type TaskInput = z.infer<typeof taskInputSchema>;
