import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppChrome } from "@/components/app-chrome";
import { AdSlot } from "@/components/ad-slot";
import { isUnlimited } from "@/lib/membership";
import { listConversations, otherUserId } from "@/lib/chats";
import { photosFromUser } from "@/lib/photos";
import { formatDistanceToNow } from "date-fns";

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true, membershipExpiresAt: true },
  });
  const unlimited = isUnlimited(me?.membershipTier, me?.membershipExpiresAt);
  const rows = await listConversations(session.user.id);

  const chats = rows.map((row) => {
    const other =
      otherUserId(row.userAId, row.userBId, session.user.id) === row.userAId
        ? row.userA
        : row.userB;
    return {
      id: row.id,
      lastText: row.lastText,
      lastMessageAt: row.lastMessageAt,
      name: other.deletedAt ? "Deleted user" : other.name ?? "Someone nearby",
      image: other.deletedAt ? null : photosFromUser(other)[0] ?? other.image,
    };
  });

  return (
    <AppChrome locationLabel="Inbox" isUnlimited={unlimited}>
      {unlimited ? null : <AdSlot compact />}
      {chats.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffc800]">Inbox</p>
          <h1 className="mt-3 text-2xl font-black">No chats yet</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-400">
            Open someone on the grid and tap Chat. Closest people show up first.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/10">
          {chats.map((chat) => (
            <li key={chat.id}>
              <Link href={`/inbox/${chat.id}`} className="flex items-center gap-3 px-4 py-3">
                {chat.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={chat.image} alt="" className="size-12 rounded-md object-cover" />
                ) : (
                  <span className="flex size-12 items-center justify-center rounded-md bg-white/10 text-lg font-black">
                    {chat.name.charAt(0)}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-bold">{chat.name}</span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-500">
                      {formatDistanceToNow(chat.lastMessageAt, { addSuffix: false })}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-zinc-400">
                    {chat.lastText || "Say hi"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppChrome>
  );
}
