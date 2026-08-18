"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const THRESHOLD = 68;
const MAX_PULL = 112;

type PullToRefreshProps = {
  children: ReactNode;
  onRefresh: () => void | Promise<void>;
  refreshing?: boolean;
};

export function PullToRefresh({ children, onRefresh, refreshing = false }: PullToRefreshProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullRef = useRef(0);
  const [pull, setPull] = useState(0);

  useEffect(() => {
    pullRef.current = pull;
  }, [pull]);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;

    const onTouchStart = (event: TouchEvent) => {
      if (refreshing) return;
      if (node.scrollTop > 0) return;
      startY.current = event.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!pulling.current || refreshing) return;
      const delta = event.touches[0].clientY - startY.current;
      if (node.scrollTop > 0 || delta <= 0) {
        if (pullRef.current !== 0) setPull(0);
        return;
      }
      const next = Math.min(delta * 0.42, MAX_PULL);
      setPull(next);
      if (next > 8) event.preventDefault();
    };

    const onTouchEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;
      const shouldRefresh = pullRef.current >= THRESHOLD && !refreshing;
      setPull(0);
      if (shouldRefresh) void onRefresh();
    };

    node.addEventListener("touchstart", onTouchStart, { passive: true });
    node.addEventListener("touchmove", onTouchMove, { passive: false });
    node.addEventListener("touchend", onTouchEnd);
    node.addEventListener("touchcancel", onTouchEnd);
    return () => {
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchmove", onTouchMove);
      node.removeEventListener("touchend", onTouchEnd);
      node.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [onRefresh, refreshing]);

  const armed = pull >= THRESHOLD || refreshing;
  const indicator = refreshing ? THRESHOLD : pull;

  return (
    <div
      ref={scroller}
      className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
    >
      <div
        className="pointer-events-none flex items-center justify-center overflow-hidden text-[#ffc800]"
        style={{ height: indicator }}
        aria-hidden
      >
        <RefreshCw
          className={cn("size-5 transition-transform", refreshing && "animate-spin")}
          style={{ transform: `rotate(${Math.min(pull * 3, 180)}deg)` }}
        />
      </div>
      {children}
      <span className="sr-only" aria-live="polite">
        {refreshing ? "Refreshing nearby people" : armed ? "Release to refresh" : ""}
      </span>
    </div>
  );
}
