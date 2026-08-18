import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppChrome } from "@/components/app-chrome";
import { AdSlot } from "@/components/ad-slot";
import { isUnlimited } from "@/lib/membership";

export default async function TapsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true, membershipExpiresAt: true },
  });
  const unlimited = isUnlimited(me?.membershipTier, me?.membershipExpiresAt);

  return (
    <AppChrome locationLabel="Taps" isUnlimited={unlimited}>
      {unlimited ? null : <AdSlot compact />}
      <div className="px-5 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffc800]">Taps</p>
        <h1 className="mt-3 text-2xl font-black">Nobody has tapped you</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-400">
          Tap a profile on the grid to send a flame. Fresh and nearby people appear first.
        </p>
      </div>
    </AppChrome>
  );
}
