"use client";

import { type FormEvent, useState } from "react";
import { errorMessage } from "@/lib/error-message";
import { taskInputSchema } from "@/lib/task-schema";
import { trpc } from "@/lib/trpc/client";
import type { FeedbackState } from "./feedback";
import { PlusIcon } from "./icons";

// Adds a task without leaving the list; the full form is for adding a description.
export function QuickAdd({ onFeedback }: { onFeedback: (feedback: FeedbackState) => void }) {
  const [titulo, setTitulo] = useState("");
  const utils = trpc.useUtils();

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => onFeedback({ kind: "success", message: "Task created." }),
    onError: (error, variables) => {
      // Gives the text back, unless the user has already started typing the next task.
      setTitulo((current) => current || variables.titulo);
      onFeedback({ kind: "error", message: errorMessage(error) });
    },
    onSettled: () => utils.tasks.invalidate(),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = taskInputSchema.safeParse({ titulo });
    if (!parsed.success) {
      onFeedback({ kind: "error", message: parsed.error.issues[0].message });
      return;
    }
    // Cleared right away and never disabled: a disabled input loses focus, and
    // whatever the user typed next, while the request was running, would be lost.
    setTitulo("");
    createTask.mutate(parsed.data);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 border-b border-border px-2 py-1.5 focus-within:bg-hover"
    >
      <PlusIcon size={16} className="shrink-0 text-muted" />
      <input
        id="quick-add"
        aria-label="Add a task"
        placeholder="Add a task and press Enter"
        className="min-w-0 flex-1 bg-transparent py-1 outline-none placeholder:text-muted"
        value={titulo}
        onChange={(event) => setTitulo(event.target.value)}
      />
      {createTask.isPending && (
        <span role="status" className="text-xs text-muted">
          Saving...
        </span>
      )}
      {titulo.trim() && (
        <button type="submit" className="btn btn-primary !py-1">
          Add
        </button>
      )}
    </form>
  );
}
