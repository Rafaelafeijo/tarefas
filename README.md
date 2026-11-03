# Tarefas

A simple task manager with server-rendered lists, built with Next.js 15 and tRPC. Tasks are kept in memory, so there is no database to set up.

## Stack

- **Next.js 15 (App Router)**: pages, server rendering and the API route.
- **TypeScript**: types shared from the router to the UI.
- **tRPC v11**: type-safe API without writing a client by hand.
- **Zod**: input validation, on the server and in the form.
- **TanStack Query**: client cache, mutations and infinite scroll.
- **Tailwind CSS**: styling, without a component library.

## Running it

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. For a production build: `npm run build && npm start`.

## How it works

The first load of a page is rendered on the server. The Server Component calls the router in-process, with no HTTP request:

```
Server Component → createCaller → router → store
```

After that, the browser talks to the API:

```
Client component → httpBatchLink → /api/trpc → router → store
```

```
src/
├── app/
│   ├── api/trpc/[trpc]/route.ts  # exposes the router over HTTP
│   ├── tasks/new/page.tsx        # create page
│   ├── tasks/[id]/edit/page.tsx  # edit page, loads the task on the server
│   ├── layout.tsx                # fonts, tRPC provider, page container
│   ├── not-found.tsx             # 404 page
│   └── page.tsx                  # task list, server-rendered per request
├── components/
│   ├── feedback.tsx              # success/error bar, auto-dismisses
│   ├── task-form.tsx             # shared create/edit form
│   └── task-list.tsx             # list, delete, infinite scroll
├── lib/
│   ├── task-schema.ts            # Zod schema shared by form and API
│   └── trpc/                     # React client, provider, server caller
└── server/
    ├── routers/                  # tasks router and root router
    ├── store.ts                  # in-memory tasks and seed data
    └── trpc.ts                   # tRPC setup and error formatting
```

## API

All procedures are under `tasks`:

| Procedure | Input | Errors |
| --- | --- | --- |
| `list` (query) | `cursor?`, `limit?` (default 10, max 50) | `BAD_REQUEST` |
| `getById` (query) | `id` | `NOT_FOUND` |
| `create` (mutation) | `titulo`, `descricao?` | `BAD_REQUEST` |
| `update` (mutation) | `id`, `titulo`, `descricao?` | `BAD_REQUEST`, `NOT_FOUND` |
| `delete` (mutation) | `id` | `NOT_FOUND` |

## Decisions

- **In-memory `Map` on `globalThis`**: survives hot reload, and pages and the API route see the same data.
- **ISO date strings**: travel through JSON unchanged, so no superjson or `Date` transformer is needed.
- **`createCaller` for SSR**: avoids an HTTP request from the server to itself.
- **`force-dynamic` on the list page**: the list changes all the time, so it must not be cached at build time.
- **Schema in its own file**: the form imports it without pulling server code into the browser bundle.
- **`trim()` on the title**: a title made only of spaces counts as empty.
- **Cursor pagination with growing ids**: deleting a task never shifts pages, even if the cursor's own task was deleted.
- **Fixed locale and time zone for dates**: server and browser render the same text, which avoids hydration errors.
- **Native `IntersectionObserver`**: enough for infinite scroll, with a "Load more" button as fallback.
- **No route-level `loading.tsx`**: the store answers instantly, and it would make missing tasks respond with status 200 instead of 404.
- **`postcss` override in `package.json`**: Next 15 pins a version with known advisories; the override moves it to a patched one without leaving Next 15.
- **Seed data**: 25 fictional tasks, so the list and infinite scroll work on first run.
- **Portuguese field names**: `titulo`, `descricao` and `dataCriacao` are the domain vocabulary; everything else is in English.
- **No component library or auth**: not needed for an app of this size.

## User-facing states

| State | Where |
| --- | --- |
| Saving | `task-form.tsx`: button disabled, shows "Saving..." |
| Deleting | `task-list.tsx`: the row's Delete button is disabled |
| Loading more | `task-list.tsx`: "Loading more..." below the list |
| End of list | `task-list.tsx`: "You've reached the end" |
| Success | `feedback.tsx`: after create, update and delete |
| Validation error | `task-form.tsx`: "Title is required" under the field |
| Server error | `feedback.tsx`: message from the API, e.g. a task deleted in another tab |
| Empty list | `task-list.tsx`: a sentence and a link to create a task |
| Not found | `not-found.tsx`: real 404 for unknown pages and task ids |

## Limitations

- Data resets on every restart or deploy and is shared by all visitors.
- It must run as a single instance: with several, each would have its own list.
- No environment variables are required. `next start` reads `PORT` if it is set.

## What I'd do next

- Persist tasks in a database.
- Add auth with a `protectedProcedure` and a session in the tRPC context.
- Add optimistic updates to delete.
- Add automated tests for the router and the main flows.
- Translate the interface.
