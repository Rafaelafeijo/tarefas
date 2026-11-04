import Link from "next/link";
import { PlusIcon } from "@/components/icons";
import { TaskList } from "@/components/task-list";
import { STATUS_LABELS, taskStatusSchema } from "@/lib/task-schema";
import { serverCaller } from "@/lib/trpc/server";

// Forces SSR on every request: the list changes constantly, so a page
// statically cached at build time would show stale tasks.
export const dynamic = "force-dynamic";

type HomePageProps = { searchParams: Promise<{ status?: string }> };

export default async function HomePage({ searchParams }: HomePageProps) {
  // The view lives in the URL, so it can be linked and survives a reload.
  // An unknown value falls back to the default view instead of failing.
  const parsed = taskStatusSchema.safeParse((await searchParams).status);
  const status = parsed.success ? parsed.data : "pendente";
  const initialPage = await serverCaller.tasks.list({ limit: 10, status });

  return (
    <>
      <header className="mb-5 flex items-center justify-between gap-3">
        <h1>{STATUS_LABELS[status]}</h1>
        <Link href="/tasks/new" className="btn btn-primary">
          <PlusIcon size={15} />
          New task
        </Link>
      </header>
      <TaskList status={status} initialPage={initialPage} />
    </>
  );
}
