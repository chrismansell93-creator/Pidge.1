import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { otherUserId } from "@/lib/chats";
import { photosFromUser } from "@/lib/photos";

type RouteContext = { params: Promise<{ id: string }> };

async function loadOwned(conversationId: string, meId: string) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ userAId: meId }, { userBId: meId }],
    },
    include: {
      userA: { select: { id: true, name: true, image: true, photos: true, deletedAt: true } },
      userB: { select: { id: true, name: true, image: true, photos: true, deletedAt: true } },
    },
  });
}

export async function GET(_req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const conversation = await loadOwned(id, session.user.id);
  if (!conversation) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const other =
    otherUserId(conversation.userAId, conversation.userBId, session.user.id) ===
    conversation.userAId
      ? conversation.userA
      : conversation.userB;

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json({
    id: conversation.id,
    other: {
      id: other.id,
      name: other.deletedAt ? "Deleted user" : other.name,
      image: other.deletedAt ? null : photosFromUser(other)[0] ?? other.image,
    },
    messages: messages.map((message) => ({
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      mine: message.senderId === session.user.id,
      createdAt: message.createdAt,
    })),
  });
}

export async function POST(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const conversation = await loadOwned(id, session.user.id);
  if (!conversation) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const payload = (await req.json().catch(() => null)) as { body?: string } | null;
  const text = payload?.body?.trim() ?? "";
  if (text.length < 1) {
    return NextResponse.json({ error: "Type a message" }, { status: 400 });
  }
  if (text.length > 1000) {
    return NextResponse.json({ error: "Keep it under 1000 characters" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: session.user.id,
      body: text,
    },
  });

  await prisma.conversation.update({
    where: { id },
    data: {
      lastText: text.slice(0, 180),
      lastMessageAt: message.createdAt,
    },
  });

  return NextResponse.json({
    id: message.id,
    body: message.body,
    senderId: message.senderId,
    mine: true,
    createdAt: message.createdAt,
  });
}
