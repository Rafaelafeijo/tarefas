"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
    onSuccess: async () => {
      setFeedback({ kind: "success", message: "Task deleted." });
      await utils.tasks.list.invalidate();
    },
    onError: (error) => setFeedback({ kind: "error", message: error.message }),
  });

  const items = data?.pages.flatMap((page) => page.items) ?? [];

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

      <div ref={sentinelRef} />
      <div className="py-[15px] text-center text-sm text-muted">
        {error && <p role="alert" className="mb-2 text-danger">{error.message}</p>}
        {isFetchingNextPage ? (
          <p role="status">Loading more...</p>
        ) : hasNextPage ? (
          // Fallback for browsers without IntersectionObserver, and retry after an error.
          <button type="button" className="btn btn-link" onClick={() => fetchNextPage()}>
            Load more
          </button>
        ) : (
          items.length > 0 && <p>You&apos;ve reached the end</p>
        )}
      </div>
    </>
  );
}
