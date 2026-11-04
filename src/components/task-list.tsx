"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatDateTime } from "@/lib/date";
import { errorMessage } from "@/lib/error-message";
import { trpc } from "@/lib/trpc/client";
import type { listTasks } from "@/server/store";
import { Feedback, type FeedbackState } from "./feedback";
import { PencilIcon, TrashIcon } from "./icons";
import { QuickAdd } from "./quick-add";

// Only visible on hover where hovering exists; always visible on touch screens.
const rowActions =
  "flex items-center justify-end gap-0.5 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100";
const rowColumns = "grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[1fr_170px_64px]";

export function TaskList({ initialPage }: { initialPage: ReturnType<typeof listTasks> }) {
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const utils = trpc.useUtils();

  // The SSR result is page 1, so the first paint has data; the client appends the rest.
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.tasks.list.useInfiniteQuery(
      { limit: 10 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialData: { pages: [initialPage], pageParams: [null] },
      },
    );

  // IntersectionObserver is native and enough here; no scroll library needed.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) fetchNextPage();
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: () => setFeedback({ kind: "success", message: "Task deleted." }),
    onError: (error) => setFeedback({ kind: "error", message: errorMessage(error) }),
    // Also after errors: if the task was already deleted elsewhere, its row must go away.
    onSettled: () => utils.tasks.list.invalidate(),
  });

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[data.pages.length - 1].total ?? 0;

  return (
    <>
      <Feedback feedback={feedback} onDismiss={setFeedback} />

      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase">
          To do
        </span>
        <span className="text-[13px] text-muted">
          Showing {items.length} of {total} {total === 1 ? "task" : "tasks"}
        </span>
      </div>

      <section aria-label="Tasks">
        <div
          className={`${rowColumns} hidden border-b border-border px-2 pb-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase sm:grid`}
        >
          <span>Name</span>
          <span>Created</span>
        </div>

        <QuickAdd onFeedback={setFeedback} />

        {items.length === 0 ? (
          <p className="py-12 text-center text-muted">
            No tasks yet. Add one above or{" "}
            <Link href="/tasks/new" className="font-medium text-accent hover:underline">
              open the full form
            </Link>
            .
          </p>
        ) : (
          <ul>
            {items.map((task) => (
              <li
                key={task.id}
                className={`${rowColumns} group border-b border-border px-2 py-2 transition-colors hover:bg-hover`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  {/* Decorative marker: tasks have no status field, so it isn't clickable. */}
                  <span aria-hidden="true" className="mt-1 size-3 shrink-0 rounded-full border-2 border-accent" />
                  <div className="min-w-0">
                    <Link href={`/tasks/${task.id}/edit`} className="hover:text-accent">
                      <strong className="font-medium break-words">{task.titulo}</strong>
                    </Link>
                    {task.descricao && (
                      <p className="truncate text-[13px] text-muted">{task.descricao}</p>
                    )}
                    <p className="text-xs text-muted sm:hidden">{formatDateTime(task.dataCriacao)}</p>
                  </div>
                </div>
                <time dateTime={task.dataCriacao} className="hidden text-[13px] text-muted sm:block">
                  {formatDateTime(task.dataCriacao)}
                </time>
                <div className={rowActions}>
                  <Link href={`/tasks/${task.id}/edit`} aria-label={`Edit ${task.titulo}`} className="icon-btn">
                    <PencilIcon size={15} />
                  </Link>
                  <button
                    type="button"
                    aria-label={`Delete ${task.titulo}`}
                    className="icon-btn icon-btn-danger"
                    disabled={deleteTask.isPending && deleteTask.variables?.id === task.id}
                    onClick={() => deleteTask.mutate({ id: task.id })}
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div ref={sentinelRef} />
      <div className="py-4 text-center text-[13px] text-muted">
        {error && <p role="alert" className="mb-2 text-danger">{errorMessage(error)}</p>}
        {isFetchingNextPage ? (
          <p role="status">Loading more...</p>
        ) : hasNextPage ? (
          // Fallback for browsers without IntersectionObserver, and retry after an error.
          <button type="button" className="btn btn-ghost" onClick={() => fetchNextPage()}>
            Load more
          </button>
        ) : (
          items.length > 0 && <p>You&apos;ve reached the end</p>
        )}
      </div>
    </>
  );
}
