"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, Flame, Grid2x2, MapPin, MessageCircle, RefreshCw, SlidersHorizontal, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { PullToRefresh } from "@/components/pull-to-refresh";

type AppChromeProps = {
  children: React.ReactNode;
  locationLabel?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  onOpenFilters?: () => void;
  gpsHint?: string;
  isUnlimited?: boolean;
};

const tabs = [
  { href: "/", label: "Grid", icon: Grid2x2 },
  { href: "/taps", label: "Taps", icon: Flame },
  { href: "/inbox", label: "Inbox", icon: MessageCircle },
  { href: "/profile", label: "Me", icon: UserRound },
];

export function AppChrome({
  children,
  locationLabel = "Nearby",
  onRefresh,
  refreshing,
  onOpenFilters,
  gpsHint,
  isUnlimited = false,
}: AppChromeProps) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-black text-white">
      <header className="z-30 shrink-0 border-b border-white/10 bg-black/90 px-3 py-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-md bg-[#ffc800] text-sm font-black text-black">
                P
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-black tracking-[0.18em] text-white">
                  PIDGE
                </p>
                <p className="flex items-center gap-1 truncate text-[11px] font-medium text-[#ffc800]">
                  <MapPin className="size-3 shrink-0" />
                  <span className="truncate">{locationLabel}</span>
                </p>
              </div>
            </div>
            {gpsHint ? (
              <p className="mt-1 pl-10 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                {gpsHint}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-300 hover:text-white"
                aria-label="Refresh nearby grid"
              >
                <RefreshCw className={cn("size-4", refreshing && "animate-spin text-[#ffc800]")} />
              </button>
            ) : null}
            {onOpenFilters ? (
              <button
                type="button"
                onClick={onOpenFilters}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-300 hover:text-white"
                aria-label="Filter grid"
              >
                <SlidersHorizontal className="size-4" />
              </button>
            ) : null}
            <Link
              href="/membership"
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[11px] font-black",
                isUnlimited
                  ? "bg-[#ffc800] text-black"
                  : "bg-[#ffc800] text-black",
              )}
            >
              <Crown className="size-3.5 fill-current" />
              <span className="hidden sm:inline">{isUnlimited ? "UNLIMITED" : "£10 / MO"}</span>
            </Link>
          </div>
        </div>
      </header>

      {onRefresh ? (
        <PullToRefresh onRefresh={onRefresh} refreshing={Boolean(refreshing)}>
          <main className="pb-20">{children}</main>
        </PullToRefresh>
      ) : (
        <main className="min-h-0 flex-1 overflow-y-auto pb-20">{children}</main>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black/95">
        <div className="mx-auto grid max-w-5xl grid-cols-4">
          {tabs.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em]",
                  active ? "text-[#ffc800]" : "text-zinc-500",
                )}
              >
                <Icon className="size-5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
