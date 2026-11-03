import Link from "next/link";
import { TaskList } from "@/components/task-list";
import { serverCaller } from "@/lib/trpc/server";

// Forces SSR on every request: the list changes constantly, so a page
// statically cached at build time would show stale tasks.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialPage = await serverCaller.tasks.list({ limit: 10 });

  return (
    <>
      <header className="mb-[15px] flex items-center justify-between">
        <h1>Tasks</h1>
        <Link href="/tasks/new" className="btn btn-primary">
          New task
        </Link>
      </header>
      <TaskList initialPage={initialPage} />
    </>
  );
}
