"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Send } from "lucide-react";

type ChatMessage = {
  id: string;
  body: string;
  mine: boolean;
  createdAt: string;
};

type ChatThreadProps = {
  conversationId: string;
  otherName: string;
  otherImage: string | null;
  initialMessages: ChatMessage[];
};

export function ChatThread({
  conversationId,
  otherName,
  otherImage,
  initialMessages,
}: ChatThreadProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const timer = setInterval(async () => {
      const res = await fetch(`/api/chats/${conversationId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { messages: ChatMessage[] };
      setMessages(data.messages);
    }, 4000);
    return () => clearInterval(timer);
  }, [conversationId]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const res = await fetch(`/api/chats/${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await res.json().catch(() => null);
    setSending(false);
    if (!res.ok) {
      setError(data?.error ?? "Could not send");
      return;
    }
    setDraft("");
    setMessages((current) => [...current, data as ChatMessage]);
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-black text-white">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 px-3 py-2.5">
        <Link href="/inbox" className="rounded-lg p-2 text-zinc-300" aria-label="Back to inbox">
          <ChevronLeft className="size-5" />
        </Link>
        {otherImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={otherImage} alt="" className="size-9 rounded-md object-cover" />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-md bg-white/10 font-black">
            {otherName.charAt(0)}
          </span>
        )}
        <p className="truncate font-black">{otherName}</p>
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {messages.length === 0 ? (
          <p className="pt-10 text-center text-sm text-zinc-500">Say hi. Keep it 18+.</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
              <p
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-5 ${
                  message.mine ? "bg-[#ffc800] text-black" : "bg-white/10 text-white"
                }`}
              >
                {message.body}
              </p>
            </div>
          ))
        )}
        <div ref={bottom} />
      </div>

      <form
        className="shrink-0 border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        {error ? <p className="mb-2 text-xs text-red-400">{error}</p> : null}
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Message"
            maxLength={1000}
            className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-[#ffc800]"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="inline-flex size-11 items-center justify-center rounded-xl bg-[#ffc800] text-black disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
