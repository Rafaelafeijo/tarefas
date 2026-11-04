import { z } from "zod";

// Lives outside the router so the browser bundle can import it without pulling
// in server code. Same schema on both sides: the form can't disagree with the API.
export const taskStatusSchema = z.enum(["pendente", "concluida", "arquivada"], {
  error: "Invalid status",
});
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pendente: "Pending",
  concluida: "Completed",
  arquivada: "Archived",
};

export const taskInputSchema = z.object({
  // trim() first, so a title made only of spaces counts as empty.
  // `error` covers the field being absent altogether, not just empty.
  titulo: z.string({ error: "Title is required" }).trim().min(1, "Title is required"),
  descricao: z.string().trim().optional(),
  // Date only ("YYYY-MM-DD"): a due day has no time, so it can't shift between time zones.
  dataEntrega: z.iso.date({ error: "Invalid due date" }).optional(),
});

export const taskUpdateSchema = taskInputSchema.extend({
  id: z.string(),
  // Optional: leaving it out keeps the current date.
  dataCriacao: z.iso.datetime({ error: "Invalid date and time" }).optional(),
});

export type TaskInput = z.infer<typeof taskInputSchema>;
export type TaskUpdate = Omit<z.infer<typeof taskUpdateSchema>, "id">;
