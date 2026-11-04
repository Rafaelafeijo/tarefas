"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { taskInputSchema } from "@/lib/task-schema";
import { trpc } from "@/lib/trpc/client";
import type { Task } from "@/server/store";
import { Feedback, type FeedbackState } from "./feedback";

const fieldClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 outline-none transition-shadow placeholder:text-muted focus:border-accent focus:ring-3 focus:ring-accent-soft";
const labelClass = "mb-1.5 block text-[13px] font-semibold";

type TaskFormProps = { mode: "create"; task?: undefined } | { mode: "edit"; task: Task };

export function TaskForm({ mode, task }: TaskFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [titulo, setTitulo] = useState(task?.titulo ?? "");
  const [descricao, setDescricao] = useState(task?.descricao ?? "");
  // The title error only appears after the user leaves the field or tries to submit.
  const [touched, setTouched] = useState(false);
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const mutationOptions = {
    onSuccess: async () => {
      setSaved(true);
      setFeedback({ kind: "success", message: mode === "create" ? "Task created." : "Task updated." });
      await utils.tasks.list.invalidate();
      // Short delay so the user sees the message before the page changes.
      setTimeout(() => router.push("/"), 800);
    },
    // Includes server errors, e.g. editing a task deleted in another tab.
    onError: (error: { message: string }) => setFeedback({ kind: "error", message: error.message }),
  };
  const createTask = trpc.tasks.create.useMutation(mutationOptions);
  const updateTask = trpc.tasks.update.useMutation(mutationOptions);

  const pending = createTask.isPending || updateTask.isPending;
  const validation = taskInputSchema.safeParse({ titulo, descricao });
  const titleError = touched && !validation.success ? validation.error.issues[0]?.message : undefined;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!validation.success) return;

    if (task) updateTask.mutate({ id: task.id, ...validation.data });
    else createTask.mutate(validation.data);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5">{mode === "create" ? "New task" : "Edit task"}</h1>
      <Feedback feedback={feedback} onDismiss={setFeedback} />

      {/* noValidate: our validation shows the message; the browser's popup would hide it. */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4 rounded-xl border border-border p-5 shadow-sm"
      >
        <div>
          <label htmlFor="titulo" className={labelClass}>
            Title
          </label>
          <input
            id="titulo"
            className={fieldClass}
            placeholder="What needs to be done?"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={Boolean(titleError)}
            aria-describedby={titleError ? "titulo-error" : undefined}
            required
          />
          {titleError && (
            <p id="titulo-error" className="mt-1.5 text-[13px] text-danger">
              {titleError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="descricao" className={labelClass}>
            Description <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="descricao"
            className={fieldClass}
            rows={5}
            placeholder="Add more details"
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Link href="/" className="btn btn-ghost">
            Cancel
          </Link>
          {/* Stays disabled after saving, so a double click can't create a second task. */}
          <button type="submit" className="btn btn-primary" disabled={pending || saved}>
            {pending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
