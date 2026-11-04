"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { STATUS_LABELS, type TaskStatus } from "@/lib/task-schema";
import { trpc } from "@/lib/trpc/client";
import { ArchiveIcon, CircleCheckIcon, CircleIcon } from "./icons";

const VIEWS: { status: TaskStatus; href: string; Icon: typeof CircleIcon }[] = [
  { status: "pendente", href: "/", Icon: CircleIcon },
  { status: "concluida", href: "/?status=concluida", Icon: CircleCheckIcon },
  { status: "arquivada", href: "/?status=arquivada", Icon: ArchiveIcon },
];

export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const counts = trpc.tasks.counts.useQuery();

  const currentStatus = searchParams.get("status") ?? "pendente";

  return (
    <nav aria-label="Task views" className="flex w-full gap-1 md:flex-col">
      {VIEWS.map(({ status, href, Icon }) => {
        const active = pathname === "/" && currentStatus === status;
        return (
          <Link
            key={status}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors md:flex-none ${
              active ? "bg-accent-soft text-accent" : "text-muted hover:bg-hover hover:text-ink"
            }`}
          >
            <Icon size={15} className="hidden shrink-0 sm:block" />
            <span className="truncate">{STATUS_LABELS[status]}</span>
            <span className="ml-auto text-xs tabular-nums">{counts.data?.[status]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
