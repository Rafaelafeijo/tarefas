import type { TaskInput, TaskUpdate } from "@/lib/task-schema";

// Field names are in Portuguese by design; they are the app's domain vocabulary.
export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  // ISO-8601 string: survives JSON as is, so no superjson/Date transformer is needed.
  dataCriacao: string;
};

type Store = { tasks: Map<string, Task>; nextId: number };

const SEED_COUNT = 100;
const SEED_VERBS = ["Review", "Update", "Document", "Test", "Plan", "Clean up", "Audit", "Simplify", "Prepare", "Share"];
const SEED_SUBJECTS = [
  "the sprint backlog",
  "the project roadmap",
  "the weekly status report",
  "the onboarding checklist",
  "the release notes",
  "the checkout flow",
  "the search results page",
  "the customer feedback summary",
  "the deployment process",
  "the reports dashboard",
  "the shared drive folders",
];

function createSeededStore(): Store {
  const tasks = new Map<string, Task>();
  const hoursBetweenTasks = 7;

  for (let index = 0; index < SEED_COUNT; index++) {
    const id = String(index + 1);
    // 10 verbs and 11 subjects share no factor, so every combination is unique.
    const titulo = `${SEED_VERBS[index % SEED_VERBS.length]} ${SEED_SUBJECTS[index % SEED_SUBJECTS.length]}`;
    const hoursAgo = (SEED_COUNT - index) * hoursBetweenTasks;

    tasks.set(id, {
      id,
      titulo,
      descricao: index % 3 === 0 ? "Sample task created at startup." : undefined,
      dataCriacao: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
    });
  }

  return { tasks, nextId: SEED_COUNT + 1 };
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

  return { items, nextCursor, total: store.tasks.size };
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

// Omitting descricao clears it; omitting dataCriacao keeps the current date.
export function updateTask(id: string, input: TaskUpdate) {
  const existing = store.tasks.get(id);
  if (!existing) return undefined;

  const updated: Task = {
    ...existing,
    titulo: input.titulo,
    descricao: input.descricao || undefined,
    dataCriacao: input.dataCriacao ?? existing.dataCriacao,
  };
  store.tasks.set(id, updated);
  return updated;
}

export function deleteTask(id: string) {
  return store.tasks.delete(id);
}
