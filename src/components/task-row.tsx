"use client";

import Link from "next/link";
import { formatDate, formatDateTime, isOverdue } from "@/lib/date";
import { errorMessage } from "@/lib/error-message";
import type { TaskStatus } from "@/lib/task-schema";
import { trpc } from "@/lib/trpc/client";
import type { Task } from "@/server/store";
import type { FeedbackState } from "./feedback";
import { ArchiveIcon, CheckIcon, PencilIcon, RestoreIcon, TrashIcon } from "./icons";

export const rowColumns =
  "grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[1fr_140px_100px_96px]";

// Only visible on hover where hovering exists; always visible on touch screens.
const rowActions =
  "flex items-center justify-end gap-0.5 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100";

const STATUS_MESSAGES: Record<TaskStatus, string> = {
  pendente: "Task moved to pending.",
  concluida: "Task completed.",
  arquivada: "Task archived.",
};

function DueDate({ date, overdue }: { date: string; overdue: boolean }) {
  if (!overdue) return <span>{formatDate(date)}</span>;
  return (
    <span className="font-medium text-danger">
      {formatDate(date)}
      {/* Color alone wouldn't reach screen readers. */}
      <span className="sr-only"> (overdue)</span>
    </span>
  );
}

type TaskRowProps = { task: Task; onFeedback: (feedback: FeedbackState) => void };

export function TaskRow({ task, onFeedback }: TaskRowProps) {
  const utils = trpc.useUtils();
  // Invalidates lists and sidebar counts. Also after errors: if the task was
  // already deleted elsewhere, its row must go away.
  const refresh = () => utils.tasks.invalidate();
  const onError = (error: { message: string; data?: unknown }) =>
    onFeedback({ kind: "error", message: errorMessage(error) });

  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: () => onFeedback({ kind: "success", message: "Task deleted." }),
    onError,
    onSettled: refresh,
  });
  const setStatus = trpc.tasks.setStatus.useMutation({
    onSuccess: (updated) => onFeedback({ kind: "success", message: STATUS_MESSAGES[updated.status] }),
    onError,
    onSettled: refresh,
  });

  const pending = deleteTask.isPending || setStatus.isPending;
  const completed = task.status === "concluida";
  const archived = task.status === "arquivada";
  // A finished or archived task can't be late anymore.
  const overdue = Boolean(task.dataEntrega) && task.status === "pendente" && isOverdue(task.dataEntrega!);

  return (
    <li className={`${rowColumns} group border-b border-border px-2 py-2 transition-colors hover:bg-hover`}>
      <div className="flex min-w-0 items-start gap-3">
        {archived ? (
          <span aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 rounded-full border-2 border-border" />
        ) : (
          <button
            type="button"
            role="checkbox"
            aria-checked={completed}
            aria-label={completed ? `Mark ${task.titulo} as pending` : `Complete ${task.titulo}`}
            disabled={pending}
            onClick={() => setStatus.mutate({ id: task.id, status: completed ? "pendente" : "concluida" })}
            className={`mt-0.5 flex size-[18px] shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-accent transition-colors disabled:opacity-50 ${
              completed ? "bg-accent text-white" : "text-accent hover:bg-accent-soft"
            }`}
          >
            {completed && <CheckIcon size={11} />}
          </button>
        )}
        <div className="min-w-0">
          <Link href={`/tasks/${task.id}/edit`} className="hover:text-accent">
            <strong className={`font-medium break-words ${completed ? "text-muted line-through" : ""}`}>
              {task.titulo}
            </strong>
          </Link>
          {task.descricao && <p className="truncate text-[13px] text-muted">{task.descricao}</p>}
          <p className="text-xs text-muted sm:hidden">
            {formatDateTime(task.dataCriacao)}
            {task.dataEntrega && (
              <>
                {" · Due "}
                <DueDate date={task.dataEntrega} overdue={overdue} />
              </>
            )}
          </p>
        </div>
      </div>
      <time dateTime={task.dataCriacao} className="hidden text-[13px] text-muted sm:block">
        {formatDateTime(task.dataCriacao)}
      </time>
      <span className="hidden text-[13px] text-muted sm:block">
        {task.dataEntrega ? <DueDate date={task.dataEntrega} overdue={overdue} /> : "—"}
      </span>
      <div className={rowActions}>
        <Link href={`/tasks/${task.id}/edit`} aria-label={`Edit ${task.titulo}`} className="icon-btn">
          <PencilIcon size={15} />
        </Link>
        <button
          type="button"
          aria-label={archived ? `Restore ${task.titulo}` : `Archive ${task.titulo}`}
          className="icon-btn"
          disabled={pending}
          onClick={() => setStatus.mutate({ id: task.id, status: archived ? "pendente" : "arquivada" })}
        >
          {archived ? <RestoreIcon size={15} /> : <ArchiveIcon size={15} />}
        </button>
        <button
          type="button"
          aria-label={`Delete ${task.titulo}`}
          className="icon-btn icon-btn-danger"
          disabled={pending}
          onClick={() => deleteTask.mutate({ id: task.id })}
        >
          <TrashIcon size={15} />
        </button>
      </div>
    </li>
  );
}
