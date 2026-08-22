import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { otherUserId } from "@/lib/chats";
import { photosFromUser } from "@/lib/photos";
import { ChatThread } from "@/components/chat-thread";
import { requirePageUser } from "@/lib/active-user";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const active = await requirePageUser();

  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      OR: [{ userAId: active.id }, { userBId: active.id }],
    },
    include: {
      userA: { select: { id: true, name: true, image: true, photos: true, deletedAt: true } },
      userB: { select: { id: true, name: true, image: true, photos: true, deletedAt: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 200 },
    },
  });
  if (!conversation) notFound();

  const other =
    otherUserId(conversation.userAId, conversation.userBId, active.id) ===
    conversation.userAId
      ? conversation.userA
      : conversation.userB;

  return (
    <ChatThread
      conversationId={conversation.id}
      otherName={other.deletedAt ? "Deleted user" : other.name ?? "Someone nearby"}
      otherImage={other.deletedAt ? null : photosFromUser(other)[0] ?? other.image}
      initialMessages={conversation.messages.map((message) => ({
        id: message.id,
        body: message.body,
        mine: message.senderId === active.id,
        createdAt: message.createdAt.toISOString(),
      }))}
    />
  );
}
