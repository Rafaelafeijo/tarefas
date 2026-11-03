"use client";

import Link from "next/link";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import type { listTasks } from "@/server/store";
import { Feedback, type FeedbackState } from "./feedback";

// Fixed locale and time zone: server and browser must format the date identically,
// otherwise React reports a hydration mismatch.
const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

// Only visible on hover where hovering exists; always visible on touch screens.
const rowActions =
  "flex shrink-0 items-center [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100";

export function TaskList({ initialPage }: { initialPage: ReturnType<typeof listTasks> }) {
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const utils = trpc.useUtils();

  // First paint uses the SSR data; from there the client owns the list.
  const { data } = trpc.tasks.list.useQuery({ limit: 10 }, { initialData: initialPage });

  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: async () => {
      setFeedback({ kind: "success", message: "Task deleted." });
      await utils.tasks.list.invalidate();
    },
    onError: (error) => setFeedback({ kind: "error", message: error.message }),
  });

  const items = data?.items ?? [];

  return (
    <>
      <Feedback feedback={feedback} onDismiss={setFeedback} />

      <section className="card">
        {items.length === 0 ? (
          <p className="p-[30px] text-center text-muted">
            No tasks yet.{" "}
            <Link href="/tasks/new" className="text-blue underline">
              Create your first task
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((task) => (
              <li key={task.id} className="group flex items-start justify-between gap-[15px] p-[15px]">
                <div className="min-w-0">
                  <strong className="block font-medium break-words">{task.titulo}</strong>
                  {task.descricao && (
                    <p className="text-sm break-words text-muted">{task.descricao}</p>
                  )}
                  <time dateTime={task.dataCriacao} className="text-xs text-muted">
                    {dateFormat.format(new Date(task.dataCriacao))}
                  </time>
                </div>
                <div className={rowActions}>
                  <Link href={`/tasks/${task.id}/edit`} className="btn btn-link">
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={deleteTask.isPending && deleteTask.variables?.id === task.id}
                    onClick={() => deleteTask.mutate({ id: task.id })}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
