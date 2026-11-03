import { TRPCError } from "@trpc/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/task-form";
import { serverCaller } from "@/lib/trpc/server";

async function loadTask(id: string) {
  try {
    return await serverCaller.tasks.getById({ id });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
}

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Loading on the server: the form is filled on first paint and a bad id is a real 404.
  const task = await loadTask(id);

  return (
    <>
      <Link href="/" className="back-link">
        ← Back to tasks
      </Link>
      <TaskForm mode="edit" task={task} />
    </>
  );
}
