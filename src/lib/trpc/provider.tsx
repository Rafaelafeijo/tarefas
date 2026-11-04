"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { trpc } from "./client";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  // In state, not at module level: on the server a module-level client
  // would share its cache between different visitors' requests.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // "always": offline requests fail and show a message. By default they
        // pause silently, leaving buttons stuck with no explanation.
        defaultOptions: {
          queries: { networkMode: "always" },
          mutations: { networkMode: "always" },
        },
      }),
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({ links: [httpBatchLink({ url: "/api/trpc" })] }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
