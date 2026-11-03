import type { TaskInput } from "@/lib/task-schema";

// Field names are in Portuguese by design; they are the app's domain vocabulary.
export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  // ISO-8601 string: survives JSON as is, so no superjson/Date transformer is needed.
  dataCriacao: string;
};

type Store = { tasks: Map<string, Task>; nextId: number };

const SEED_TITLES = [
  "Review sprint backlog",
  "Update project roadmap",
  "Prepare weekly status report",
  "Fix broken link in documentation",
  "Plan next team retrospective",
  "Clean up unused feature flags",
  "Write onboarding checklist",
  "Book meeting room for planning",
  "Refactor date formatting helper",
  "Check accessibility of main menu",
  "Draft release notes",
  "Archive completed projects",
  "Review open pull requests",
  "Update dependencies",
  "Organize shared drive folders",
  "Add empty state to reports page",
  "Test checkout flow on mobile",
  "Summarize customer feedback",
  "Rotate staging credentials",
  "Improve search result ordering",
  "Schedule database maintenance window",
  "Document deployment process",
  "Investigate slow dashboard query",
  "Replace outdated screenshots",
  "Order new office supplies",
];

function createSeededStore(): Store {
  const tasks = new Map<string, Task>();
  const hour = 60 * 60 * 1000;

  SEED_TITLES.forEach((titulo, index) => {
    const id = String(index + 1);
    tasks.set(id, {
      id,
      titulo,
      descricao: index % 3 === 0 ? "Sample task created at startup." : undefined,
      dataCriacao: new Date(Date.now() - (SEED_TITLES.length - index) * hour).toISOString(),
    });
  });

  return { tasks, nextId: SEED_TITLES.length + 1 };
}

// On globalThis because a plain module variable would be reset by hot reload in dev,
// and Next can load this module separately for pages and for the API route.
// The store resets on every restart and is shared by all visitors: no database by design.
const globalForStore = globalThis as typeof globalThis & { taskStore?: Store };
const store = (globalForStore.taskStore ??= createSeededStore());

export function listTasks({ cursor, limit }: { cursor?: string | null; limit: number }) {
  // Map keeps insertion order and ids only grow, so reversing gives newest first.
  const newestFirst = [...store.tasks.values()].reverse();

  // Cursor instead of offset: deleting a task never shifts or repeats later pages.
  // Comparing ids (not looking up the cursor) keeps working if that task was deleted.
  const remaining = cursor
    ? newestFirst.filter((task) => Number(task.id) < Number(cursor))
    : newestFirst;

  const items = remaining.slice(0, limit);
  const nextCursor = remaining.length > limit ? items[items.length - 1].id : null;

  return { items, nextCursor };
}

export function getTask(id: string) {
  return store.tasks.get(id);
}

export function createTask(input: TaskInput) {
  const id = String(store.nextId++);
  const task: Task = {
    id,
    titulo: input.titulo,
    descricao: input.descricao || undefined,
    dataCriacao: new Date().toISOString(),
  };
  store.tasks.set(id, task);
  return task;
}

// Replaces the editable fields: omitting descricao clears it.
export function updateTask(id: string, input: TaskInput) {
  const existing = store.tasks.get(id);
  if (!existing) return undefined;

  const updated: Task = {
    ...existing,
    titulo: input.titulo,
    descricao: input.descricao || undefined,
  };
  store.tasks.set(id, updated);
  return updated;
}

export function deleteTask(id: string) {
  return store.tasks.delete(id);
}
