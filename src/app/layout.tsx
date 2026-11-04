import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { CheckIcon, ListIcon } from "@/components/icons";
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
            <aside className="flex shrink-0 items-center gap-4 border-b border-border bg-sidebar px-3 py-2.5 md:sticky md:top-0 md:h-screen md:w-60 md:flex-col md:items-stretch md:gap-5 md:border-r md:border-b-0 md:py-4">
              <Link href="/" className="flex items-center gap-2 px-2 font-bold">
                <span className="flex size-6 items-center justify-center rounded-md bg-accent text-white">
                  <CheckIcon size={14} />
                </span>
                Tarefas
              </Link>
              <nav aria-label="Main">
                <Link
                  href="/"
                  className="flex items-center gap-2 rounded-md bg-accent-soft px-2 py-1.5 text-[13px] font-medium text-accent"
                >
                  <ListIcon size={15} />
                  All tasks
                </Link>
              </nav>
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
