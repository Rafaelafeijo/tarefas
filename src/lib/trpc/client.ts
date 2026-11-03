import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers/_app";

// `import type` keeps the router out of the browser bundle: only its types are used.
export const trpc = createTRPCReact<AppRouter>();
