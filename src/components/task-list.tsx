"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { errorMessage } from "@/lib/error-message";
import { STATUS_LABELS, type TaskStatus } from "@/lib/task-schema";
import { trpc } from "@/lib/trpc/client";
import type { listTasks } from "@/server/store";
import { Feedback, type FeedbackState } from "./feedback";
import { QuickAdd } from "./quick-add";
import { rowColumns, TaskRow } from "./task-row";

type TaskListProps = { status: TaskStatus; initialPage: ReturnType<typeof listTasks> };

export function TaskList({ status, initialPage }: TaskListProps) {
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  // The SSR result is page 1, so the first paint has data; the client appends the rest.
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.tasks.list.useInfiniteQuery(
      { limit: 10, status },
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

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[data.pages.length - 1].total ?? 0;

  return (
    <>
      <Feedback feedback={feedback} onDismiss={setFeedback} />

      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase">
          {STATUS_LABELS[status]}
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
          <span>Due</span>
        </div>

        {/* New tasks are always pending, so adding from another view would hide them at once. */}
        {status === "pendente" && <QuickAdd onFeedback={setFeedback} />}

        {items.length === 0 ? (
          status === "pendente" ? (
            <p className="py-12 text-center text-muted">
              No tasks yet. Add one above or{" "}
              <Link href="/tasks/new" className="font-medium text-accent hover:underline">
                open the full form
              </Link>
              .
            </p>
          ) : (
            <p className="py-12 text-center text-muted">
              No {STATUS_LABELS[status].toLowerCase()} tasks.
            </p>
          )
        ) : (
          <ul>
            {items.map((task) => (
              <TaskRow key={task.id} task={task} onFeedback={setFeedback} />
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
