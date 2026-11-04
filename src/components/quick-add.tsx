"use client";

import { type FormEvent, useState } from "react";
import { taskInputSchema } from "@/lib/task-schema";
import { trpc } from "@/lib/trpc/client";
import type { FeedbackState } from "./feedback";
import { PlusIcon } from "./icons";

// Adds a task without leaving the list; the full form is for adding a description.
export function QuickAdd({ onFeedback }: { onFeedback: (feedback: FeedbackState) => void }) {
  const [titulo, setTitulo] = useState("");
  const utils = trpc.useUtils();

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: async () => {
      setTitulo("");
      onFeedback({ kind: "success", message: "Task created." });
      await utils.tasks.list.invalidate();
    },
    onError: (error) => onFeedback({ kind: "error", message: error.message }),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = taskInputSchema.safeParse({ titulo });
    if (!parsed.success) {
      onFeedback({ kind: "error", message: parsed.error.issues[0].message });
      return;
    }
    createTask.mutate(parsed.data);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 border-b border-border px-2 py-2 focus-within:bg-hover"
    >
      <PlusIcon size={16} className="shrink-0 text-muted" />
      <input
        id="quick-add"
        aria-label="Add a task"
        placeholder="Add a task and press Enter"
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
        value={titulo}
        onChange={(event) => setTitulo(event.target.value)}
        disabled={createTask.isPending}
      />
    </form>
  );
}
