"use client";

import Link from "next/link";

type AdSlotProps = {
  compact?: boolean;
};

export function AdSlot({ compact = false }: AdSlotProps) {
  return (
    <Link
      href="/membership"
      className={
        compact
          ? "flex items-center justify-between gap-3 border-y border-[#ffc800]/20 bg-[#1a1500] px-3 py-2"
          : "relative flex aspect-[4/5] flex-col justify-between overflow-hidden bg-[#161200] p-2.5 text-left"
      }
    >
      <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#ffc800]/80">
        Advert
      </span>
      <div>
        <p className={`font-black text-[#ffc800] ${compact ? "text-sm" : "text-sm leading-tight"}`}>
          Unlimited
        </p>
        <p className="text-[11px] text-zinc-300">£10 / month · no ads</p>
      </div>
      {!compact ? (
        <span className="rounded-md bg-[#ffc800] px-2 py-1 text-center text-[10px] font-black text-black">
          Upgrade
        </span>
      ) : (
        <span className="rounded-md bg-[#ffc800] px-2 py-1 text-[10px] font-black text-black">
          Remove ads
        </span>
      )}
    </Link>
  );
}
