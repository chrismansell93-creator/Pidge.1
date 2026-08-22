"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Flame, MapPin, MessageCircle, X, Zap } from "lucide-react";
import { formatDistance, isFresh, type NearbyPerson } from "@/lib/geo";
import { parseList } from "@/lib/profile-options";

type ProfileSheetProps = {
  person: NearbyPerson;
  onClose: () => void;
  onTap: (person: NearbyPerson) => void;
};

// The parent renders this with `key={person.id}`, so a new person remounts
// the component and resets `index` naturally — no reset effect needed.
export function ProfileSheet({ person, onClose, onTap }: ProfileSheetProps) {
  const router = useRouter();
  const photos = person.photos?.length ? person.photos : person.image ? [person.image] : [];
  const [index, setIndex] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportNote, setReportNote] = useState<string | null>(null);

  const tags = parseList(person.interests);
  const tribes = parseList(person.tribes);

  const current = photos[index];

  function show(next: number) {
    if (photos.length === 0) return;
    setIndex((next + photos.length) % photos.length);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close profile"
        onClick={onClose}
      />
      <article className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden bg-black sm:rounded-2xl sm:border sm:border-white/10">
        <div className="relative aspect-[4/5] w-full bg-zinc-900">
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current}
              alt={`${person.name} photo ${index + 1}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl font-black text-white/40">
              {person.name.charAt(0)}
            </div>
          )}
          {photos.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute inset-y-0 left-0 w-1/3"
                aria-label="Previous photo"
                onClick={() => show(index - 1)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 w-1/3"
                aria-label="Next photo"
                onClick={() => show(index + 1)}
              />
              <div className="absolute top-3 left-3 right-12 flex gap-1">
                {photos.map((url, i) => (
                  <button
                    key={url + i}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`h-0.5 flex-1 rounded-full ${i === index ? "bg-white" : "bg-white/30"}`}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
              <span className="absolute top-12 right-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                {index + 1}/{photos.length}
              </span>
              <button
                type="button"
                onClick={() => show(index - 1)}
                className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white"
                aria-label="Previous photo"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => show(index + 1)}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white"
                aria-label="Next photo"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-3xl font-black tracking-tight">
                  {person.name}
                  {person.age ? <span className="font-medium text-white/70">, {person.age}</span> : null}
                </h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-[#ffc800]">
                  <MapPin className="size-3.5" />
                  {person.isMe ? "This is you" : formatDistance(person.distanceMeters)}
                  {person.city ? ` · ${person.city}` : ""}
                </p>
              </div>
              {person.isBoosted ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#ffc800] px-2 py-1 text-[10px] font-black text-black">
                  <Zap className="size-3 fill-black" /> BOOST
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto px-4 py-4">
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
            {person.isOnline ? (
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-emerald-300">Online</span>
            ) : null}
            {isFresh(person.lastActiveAt) ? (
              <span className="rounded-full bg-[#ffc800]/15 px-2.5 py-1 text-[#ffc800]">Fresh</span>
            ) : null}
            {person.lookingFor ? (
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-white">{person.lookingFor}</span>
            ) : null}
            {person.gender ? (
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-white">{person.gender}</span>
            ) : null}
          </div>

          {person.into ? (
            <p className="text-sm text-zinc-300">
              <span className="font-semibold text-white">Into</span> {person.into}
            </p>
          ) : null}

          {tribes.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Tribes</p>
              <div className="flex flex-wrap gap-2">
                {tribes.map((tribe) => (
                  <span key={tribe} className="rounded-full bg-[#ffc800]/15 px-2.5 py-1 text-xs font-semibold text-[#ffc800]">
                    {tribe}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {person.headline ? (
            <p className="text-lg font-semibold text-white">{person.headline}</p>
          ) : null}
          {person.bio ? (
            <p className="text-sm leading-6 text-zinc-300">{person.bio}</p>
          ) : null}

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-300">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {!person.isMe ? (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onTap(person)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ffc800] py-3 text-sm font-black text-black"
              >
                <Flame className="size-4 fill-black" />
                Tap
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch("/api/chats", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: person.id }),
                  });
                  const data = await res.json().catch(() => null);
                  if (res.ok && data?.id) {
                    router.push(`/inbox/${data.id}`);
                    return;
                  }
                  router.push("/inbox");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-bold text-white"
              >
                <MessageCircle className="size-4" />
                Chat
              </button>
            </div>
          ) : null}

          {!person.isMe ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setReportOpen((open) => !open)}
                className="w-full text-center text-xs font-semibold text-zinc-500 underline"
              >
                Report or block
              </button>
              {reportOpen ? (
                <div className="space-y-2 rounded-xl border border-white/10 p-3">
                  <select
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black p-2 text-sm"
                  >
                    <option value="spam">Spam</option>
                    <option value="harassment">Harassment</option>
                    <option value="underage">Under 18</option>
                    <option value="hate">Hate</option>
                    <option value="nudity">Non-consensual images</option>
                    <option value="other">Other</option>
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch("/api/report", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ targetId: person.id, reason: reportReason }),
                      });
                      setReportNote(res.ok ? "Reported. Thank you." : "Could not send report");
                    }}
                    className="w-full rounded-lg bg-white/10 py-2 text-sm font-semibold"
                  >
                    Send report
                  </button>
                  {reportNote ? <p className="text-xs text-zinc-400">{reportNote}</p> : null}
                </div>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="w-full rounded-xl bg-[#ffc800] py-3 text-sm font-black text-black"
            >
              Edit my profile
            </button>
          )}
        </div>
      </article>
    </div>
  );
}
