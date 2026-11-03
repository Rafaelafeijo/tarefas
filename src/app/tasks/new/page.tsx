import Link from "next/link";
import { TaskForm } from "@/components/task-form";

export default function NewTaskPage() {
  return (
    <>
      <Link href="/" className="back-link">
        ← Back to tasks
      </Link>
      <TaskForm mode="create" />
    </>
  );
}
