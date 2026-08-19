import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOrCreateConversation, listConversations, otherUserId } from "@/lib/chats";
import { photosFromUser } from "@/lib/photos";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await listConversations(session.user.id);
  return NextResponse.json({
    chats: rows.map((row) => {
      const other =
        otherUserId(row.userAId, row.userBId, session.user.id) === row.userAId
          ? row.userA
          : row.userB;
      return {
        id: row.id,
        lastText: row.lastText,
        lastMessageAt: row.lastMessageAt,
        other: {
          id: other.id,
          name: other.deletedAt ? "Deleted user" : other.name,
          image: other.deletedAt ? null : photosFromUser(other)[0] ?? other.image,
        },
      };
    }),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { userId?: string } | null;
  if (!body?.userId) {
    return NextResponse.json({ error: "Choose someone to chat with" }, { status: 400 });
  }

  try {
    const conversation = await getOrCreateConversation(session.user.id, body.userId);
    return NextResponse.json({ id: conversation.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start chat" },
      { status: 400 },
    );
  }
}
