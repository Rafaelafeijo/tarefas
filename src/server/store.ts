import type { TaskInput, TaskStatus, TaskUpdate } from "@/lib/task-schema";

// Field names are in Portuguese by design; they are the app's domain vocabulary.
export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  // ISO-8601 string: survives JSON as is, so no superjson/Date transformer is needed.
  dataCriacao: string;
  dataEntrega?: string;
  status: TaskStatus;
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
    const createdAt = Date.now() - hoursAgo * 60 * 60 * 1000;
    // Due 3 to 27 days after creation, so the seed mixes overdue and upcoming tasks.
    const dueAt = createdAt + (3 + (index % 5) * 6) * 24 * 60 * 60 * 1000;

    tasks.set(id, {
      id,
      titulo,
      descricao: index % 3 === 0 ? "Sample task created at startup." : undefined,
      dataCriacao: new Date(createdAt).toISOString(),
      dataEntrega: index % 4 === 3 ? undefined : new Date(dueAt).toISOString().slice(0, 10),
      // 75 pending, 20 completed and 5 archived, so every view has something to show.
      status: index % 20 === 2 ? "arquivada" : index % 5 === 1 ? "concluida" : "pendente",
    });
  }

  return { tasks, nextId: SEED_COUNT + 1 };
}

// On globalThis because a plain module variable would be reset by hot reload in dev,
// and Next can load this module separately for pages and for the API route.
// The store resets on every restart and is shared by all visitors: no database by design.
const globalForStore = globalThis as typeof globalThis & { taskStore?: Store };
const store = (globalForStore.taskStore ??= createSeededStore());

export function listTasks({
  cursor,
  limit,
  status,
}: {
  cursor?: string | null;
  limit: number;
  status: TaskStatus;
}) {
  // Map keeps insertion order and ids only grow, so reversing gives newest first.
  // Filtering keeps that order, so the id cursor works the same in every view.
  const newestFirst = [...store.tasks.values()].reverse().filter((task) => task.status === status);

  // Cursor instead of offset: deleting a task never shifts or repeats later pages.
  // Comparing ids (not looking up the cursor) keeps working if that task was deleted.
  const remaining = cursor
    ? newestFirst.filter((task) => Number(task.id) < Number(cursor))
    : newestFirst;

  const items = remaining.slice(0, limit);
  const nextCursor = remaining.length > limit ? items[items.length - 1].id : null;

  return { items, nextCursor, total: newestFirst.length };
}

export function countTasks() {
  const counts: Record<TaskStatus, number> = { pendente: 0, concluida: 0, arquivada: 0 };
  for (const task of store.tasks.values()) counts[task.status]++;
  return counts;
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
    dataEntrega: input.dataEntrega,
    status: "pendente",
  };
  store.tasks.set(id, task);
  return task;
}

// Omitting descricao or dataEntrega clears it; omitting dataCriacao keeps the current date.
export function updateTask(id: string, input: TaskUpdate) {
  const existing = store.tasks.get(id);
  if (!existing) return undefined;

  const updated: Task = {
    ...existing,
    titulo: input.titulo,
    descricao: input.descricao || undefined,
    dataCriacao: input.dataCriacao ?? existing.dataCriacao,
    dataEntrega: input.dataEntrega,
  };
  store.tasks.set(id, updated);
  return updated;
}

export function setTaskStatus(id: string, status: TaskStatus) {
  const existing = store.tasks.get(id);
  if (!existing) return undefined;

  const updated: Task = { ...existing, status };
  store.tasks.set(id, updated);
  return updated;
}

export function deleteTask(id: string) {
  return store.tasks.delete(id);
}
