import Link from "next/link";
import { PlusIcon } from "@/components/icons";
import { TaskList } from "@/components/task-list";
import { serverCaller } from "@/lib/trpc/server";

// Forces SSR on every request: the list changes constantly, so a page
// statically cached at build time would show stale tasks.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialPage = await serverCaller.tasks.list({ limit: 10 });

  return (
    <>
      <header className="mb-5 flex items-center justify-between gap-3">
        <h1>All tasks</h1>
        <Link href="/tasks/new" className="btn btn-primary">
          <PlusIcon size={15} />
          New task
        </Link>
      </header>
      <TaskList initialPage={initialPage} />
    </>
  );
}
