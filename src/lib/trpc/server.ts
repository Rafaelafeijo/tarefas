import { appRouter } from "@/server/routers/_app";

// The SSR path: Server Components call the router directly, in-process,
// instead of making an HTTP request to our own API.
export const serverCaller = appRouter.createCaller({});
