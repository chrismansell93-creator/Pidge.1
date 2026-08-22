import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppChrome } from "@/components/app-chrome";
import { AdSlot } from "@/components/ad-slot";
import { isUnlimited } from "@/lib/membership";
import { photosFromUser } from "@/lib/photos";

export default async function TapsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true, membershipExpiresAt: true },
  });
  const unlimited = isUnlimited(me?.membershipTier, me?.membershipExpiresAt);

  const taps = await prisma.tap.findMany({
    where: { toUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
          image: true,
          photos: true,
          age: true,
          headline: true,
          deletedAt: true,
        },
      },
    },
  });

  const received = taps.filter((tap) => !tap.fromUser.deletedAt);

  return (
    <AppChrome locationLabel="Taps" isUnlimited={unlimited}>
      {unlimited ? null : <AdSlot compact />}
      {received.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffc800]">Taps</p>
          <h1 className="mt-3 text-2xl font-black">Nobody has tapped you</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-400">
            Tap a profile on the grid to send a flame. Fresh and nearby people appear first.
          </p>
        </div>
      ) : (
        <div className="px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffc800]">Taps</p>
          <h1 className="mt-2 text-2xl font-black">{received.length} people tapped you</h1>
          <ul className="mt-5 space-y-3">
            {received.map((tap) => {
              const photos = photosFromUser(tap.fromUser);
              const image = photos[0] ?? tap.fromUser.image;
              return (
                <li
                  key={tap.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image || "/brand/icon.svg"}
                    alt=""
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">
                      {tap.fromUser.name ?? "Someone nearby"}
                      {tap.fromUser.age ? `, ${tap.fromUser.age}` : ""}
                    </p>
                    <p className="truncate text-sm text-zinc-400">
                      {tap.fromUser.headline || "Tapped you"}
                    </p>
                  </div>
                  <Link
                    href={`/inbox`}
                    className="rounded-full bg-[#ffc800] px-3 py-1.5 text-xs font-bold text-black"
                  >
                    Chat
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </AppChrome>
  );
}
