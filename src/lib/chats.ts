import { prisma } from "@/lib/prisma";

export function pairIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function otherUserId(userAId: string, userBId: string, meId: string) {
  return userAId === meId ? userBId : userAId;
}

const userSelect = {
  id: true,
  name: true,
  image: true,
  photos: true,
  deletedAt: true,
} as const;

export async function getOrCreateConversation(meId: string, otherId: string) {
  if (meId === otherId) throw new Error("Cannot chat with yourself");
  const other = await prisma.user.findFirst({
    where: { id: otherId, deletedAt: null },
    select: { id: true },
  });
  if (!other) throw new Error("User not found");

  const [userAId, userBId] = pairIds(meId, otherId);
  return prisma.conversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId },
    include: {
      userA: { select: userSelect },
      userB: { select: userSelect },
    },
  });
}

export async function listConversations(meId: string) {
  return prisma.conversation.findMany({
    where: { OR: [{ userAId: meId }, { userBId: meId }] },
    include: {
      userA: { select: userSelect },
      userB: { select: userSelect },
    },
    orderBy: { lastMessageAt: "desc" },
  });
}
