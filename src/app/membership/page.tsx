"use client";

import { useEffect, useState } from "react";
import { Check, Crown, Megaphone } from "lucide-react";
import { AppChrome } from "@/components/app-chrome";
import { Button } from "@/components/ui/button";
import { UNLIMITED_PRICE_GBP } from "@/lib/membership";
import { canUsePlayBilling, purchaseUnlimited } from "@/lib/play-billing";

type Status = {
  tier: "free" | "unlimited";
  isUnlimited: boolean;
  expiresAt: string | null;
};

const limitedPerks = [
  "See the 50 closest profiles",
  "8 taps a day",
  "Adverts on the grid",
  "Basic chat",
];

const unlimitedPerks = [
  "See everyone nearby",
  "Unlimited taps and chat",
  "No adverts",
  "Cancel in Google Play",
];

export default function MembershipPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const android = canUsePlayBilling();

  useEffect(() => {
    fetch("/api/membership")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStatus(data);
      })
      .catch(() => undefined);
  }, []);

  async function startPlayPurchase() {
    setBusy(true);
    setError(null);
    try {
      const purchase = await purchaseUnlimited();
      const res = await fetch("/api/membership/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchase),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error ?? "Play purchase could not be verified");
        return;
      }
      setStatus(json);
      setNote("Google Play charged this subscription.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Play purchase cancelled");
    } finally {
      setBusy(false);
    }
  }

  async function switchToLimited() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "free" }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error ?? "Could not change plan");
        return;
      }
      setStatus(json);
      setNote("Unlimited cancelled in the app. Also cancel the Play subscription in Google Play if it is still renewing.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppChrome locationLabel="Membership" isUnlimited={status?.isUnlimited}>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffc800]">Membership</p>
        <h1 className="mt-2 text-3xl font-black">Choose how you use Pidge</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Limited is free with adverts. Unlimited is £{UNLIMITED_PRICE_GBP} a month, billed only by Google Play.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-zinc-300">
              <Megaphone className="size-4" />
              <p className="text-xs font-bold uppercase tracking-[0.16em]">Limited</p>
            </div>
            <h2 className="mt-3 text-2xl font-black">Free</h2>
            <p className="text-sm text-zinc-400">With adverts</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              {limitedPerks.map((perk) => (
                <li key={perk} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-zinc-500" />
                  {perk}
                </li>
              ))}
            </ul>
            {status?.isUnlimited ? (
              <Button
                type="button"
                variant="outline"
                size="full"
                disabled={busy}
                onClick={() => void switchToLimited()}
                className="mt-6 border-white/15 text-zinc-300"
              >
                Back to Limited
              </Button>
            ) : (
              <p className="mt-6 rounded-xl bg-white/5 py-3 text-center text-sm font-semibold text-zinc-400">
                Your current plan
              </p>
            )}
          </article>

          <article className="rounded-2xl border border-[#ffc800] bg-[#161200] p-5">
            <div className="flex items-center gap-2 text-[#ffc800]">
              <Crown className="size-4 fill-[#ffc800]" />
              <p className="text-xs font-bold uppercase tracking-[0.16em]">Unlimited</p>
            </div>
            <h2 className="mt-3 text-2xl font-black">
              £{UNLIMITED_PRICE_GBP}
              <span className="text-base font-semibold text-zinc-300"> / month</span>
            </h2>
            <p className="text-sm text-zinc-400">Google Play subscription</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-200">
              {unlimitedPerks.map((perk) => (
                <li key={perk} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#ffc800]" />
                  {perk}
                </li>
              ))}
            </ul>
            {status?.isUnlimited ? (
              <p className="mt-6 rounded-xl bg-[#ffc800] py-3 text-center text-sm font-black text-black">
                Active
                {status.expiresAt
                  ? ` · paid until ${new Date(status.expiresAt).toLocaleDateString("en-GB")}`
                  : ""}
              </p>
            ) : (
              <Button
                type="button"
                variant="brand"
                size="full"
                disabled={busy}
                onClick={() => void startPlayPurchase()}
                className="mt-6"
              >
                {busy ? "Opening Google Play…" : `Subscribe on Play · £${UNLIMITED_PRICE_GBP}/mo`}
              </Button>
            )}
          </article>
        </div>
        {!android ? (
          <p className="mt-4 text-sm text-zinc-500">
            Payments run through Google Play on the Android app. The website cannot take card payments.
          </p>
        ) : null}
        {note ? <p className="mt-4 text-sm text-emerald-300">{note}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      </div>
    </AppChrome>
  );
}
