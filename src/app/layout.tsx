import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { CheckIcon } from "@/components/icons";
import { SidebarNav } from "@/components/sidebar-nav";
import { TRPCProvider } from "@/lib/trpc/provider";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tarefas",
  description: "A simple task manager.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Font variable goes on <html>: the theme tokens in globals.css resolve it at :root.
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <TRPCProvider>
          <div className="flex min-h-screen flex-col md:flex-row">
            <aside className="flex shrink-0 flex-col gap-2 border-b border-border bg-sidebar px-3 py-2.5 md:sticky md:top-0 md:h-screen md:w-60 md:gap-5 md:border-r md:border-b-0 md:py-4">
              <Link href="/" className="flex items-center gap-2 px-2 font-bold">
                <span className="flex size-6 items-center justify-center rounded-md bg-accent text-white">
                  <CheckIcon size={14} />
                </span>
                Tarefas
              </Link>
              {/* useSearchParams needs a Suspense boundary, or static pages fail to build. */}
              <Suspense fallback={null}>
                <SidebarNav />
              </Suspense>
            </aside>
            <main className="min-w-0 flex-1">
              <div className="mx-auto max-w-5xl px-4 py-5 md:px-8 md:py-7">{children}</div>
            </main>
          </div>
        </TRPCProvider>
      </body>
    </html>
  );
}
