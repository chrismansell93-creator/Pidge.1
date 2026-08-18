"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Zap } from "lucide-react";
import { AppChrome } from "@/components/app-chrome";
import { AdSlot } from "@/components/ad-slot";
import { ProfileSheet } from "@/components/profile-sheet";
import {
  formatDistance,
  isFresh,
  sortNearby,
  type NearbyPerson,
} from "@/lib/geo";
import { cn } from "@/lib/utils";
import { TRIBE_OPTIONS, hasTribe, matchesGenderFilter } from "@/lib/profile-options";
import {
  FREE_DAILY_TAPS,
  FREE_VISIBLE_PROFILES,
  tapsStorageKey,
} from "@/lib/membership";

type GridFilter = "all" | "online" | "fresh" | "men" | "women" | "nb" | "trans" | "one" | "five" | "fifteen";

type GeoGridProps = {
  initialPeople: NearbyPerson[];
  initialCity?: string | null;
  initialUnlimited?: boolean;
};

const filters: { id: GridFilter; label: string }[] = [
  { id: "all", label: "Nearby" },
  { id: "online", label: "Online" },
  { id: "fresh", label: "Fresh" },
  { id: "men", label: "Men" },
  { id: "women", label: "Women" },
  { id: "nb", label: "Non-binary" },
  { id: "trans", label: "Trans" },
  { id: "one", label: "< 1 km" },
  { id: "five", label: "< 5 km" },
  { id: "fifteen", label: "< 15 km" },
];

export function GeoGrid({ initialPeople, initialCity, initialUnlimited = false }: GeoGridProps) {
  const router = useRouter();
  const [people, setPeople] = useState(initialPeople);
  const [city, setCity] = useState(initialCity ?? "Nearby");
  const [filter, setFilter] = useState<GridFilter>("all");
  const [selected, setSelected] = useState<NearbyPerson | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [gpsHint, setGpsHint] = useState("Sorted by distance");
  const [toast, setToast] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tribeFilter, setTribeFilter] = useState<string | null>(null);
  const [isUnlimited, setIsUnlimited] = useState(initialUnlimited);
  const [tapsUsed, setTapsUsed] = useState(0);

  const loadNearby = useCallback(async (lat?: number, lng?: number) => {
    const params = new URLSearchParams();
    if (lat != null && lng != null) {
      params.set("lat", String(lat));
      params.set("lng", String(lng));
    }
    const res = await fetch(`/api/nearby?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      setGpsHint("Could not refresh nearby profiles");
      return;
    }
    const data = (await res.json()) as {
      city?: string | null;
      usingLiveGps?: boolean;
      people: NearbyPerson[];
    };
    setPeople(sortNearby(data.people ?? []));
    if (data.city) setCity(data.city);
    return data;
  }, []);

  const syncLocation = useCallback(async () => {
    setRefreshing(true);
    setGpsHint("Updating location…");

    const applyCoords = async (
      latitude: number,
      longitude: number,
      accuracyMeters: number,
      label?: string,
    ) => {
      let nextCity = label;
      if (!nextCity) {
        try {
          const geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          );
          if (geoRes.ok) {
            const geo = (await geoRes.json()) as {
              locality?: string;
              city?: string;
              principalSubdivision?: string;
            };
            nextCity = geo.locality || geo.city || geo.principalSubdivision;
          }
        } catch {
          nextCity = undefined;
        }
      }

      const nearby = await loadNearby(latitude, longitude);
      if (nearby?.usingLiveGps) {
        await fetch("/api/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude, city: nextCity }),
        });
        if (nextCity) setCity(nextCity);
        setGpsHint(`GPS accuracy ±${Math.round(accuracyMeters)} m · nearest first`);
      } else {
        setGpsHint("Saved pin · closest first");
      }
    };

    if (!navigator.geolocation) {
      setGpsHint("GPS unavailable · using saved pin");
      await loadNearby();
      setRefreshing(false);
      return;
    }

    if (typeof window !== "undefined" && !sessionStorage.getItem("pidge_location_ok")) {
      const allowed = window.confirm(
        "Pidge uses your precise location to show people near you and sort the grid by distance. You can refuse and stay on a saved pin.",
      );
      if (!allowed) {
        setGpsHint("Location off · using saved pin");
        await loadNearby();
        setRefreshing(false);
        return;
      }
      sessionStorage.setItem("pidge_location_ok", "1");
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await applyCoords(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.accuracy,
          );
        } finally {
          setRefreshing(false);
        }
      },
      async () => {
        setGpsHint("Location off · using saved pin");
        await loadNearby();
        setRefreshing(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 },
    );
  }, [loadNearby]);

  useEffect(() => {
    void syncLocation();
  }, [syncLocation]);

  useEffect(() => {
    fetch("/api/membership")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.isUnlimited != null) setIsUnlimited(Boolean(data.isUnlimited));
      })
      .catch(() => undefined);
    const used = Number(localStorage.getItem(tapsStorageKey("me")) ?? 0);
    setTapsUsed(Number.isFinite(used) ? used : 0);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visible = useMemo(() => {
    return people.filter((person) => {
      if (person.isMe) return filter === "all" && !tribeFilter;
      if (tribeFilter && !hasTribe(person.tribes, tribeFilter)) return false;
      if (filter === "online") return person.isOnline;
      if (filter === "fresh") return isFresh(person.lastActiveAt);
      if (filter === "men") return matchesGenderFilter(person.gender, "men", person.tribes);
      if (filter === "women") return matchesGenderFilter(person.gender, "women", person.tribes);
      if (filter === "nb") return matchesGenderFilter(person.gender, "nb", person.tribes);
      if (filter === "trans") return matchesGenderFilter(person.gender, "trans", person.tribes);
      if (filter === "one") return (person.distanceMeters ?? Infinity) <= 1000;
      if (filter === "five") return (person.distanceMeters ?? Infinity) <= 5000;
      if (filter === "fifteen") return (person.distanceMeters ?? Infinity) <= 15000;
      return true;
    });
  }, [people, filter, tribeFilter]);

  const gridItems = useMemo(() => {
    const mine = visible.filter((person) => person.isMe);
    const others = visible.filter((person) => !person.isMe);
    const unlocked = isUnlimited ? others : others.slice(0, FREE_VISIBLE_PROFILES);
    const locked = isUnlimited ? [] : others.slice(FREE_VISIBLE_PROFILES);
    const items: Array<
      | { kind: "person"; person: NearbyPerson }
      | { kind: "ad"; id: string }
      | { kind: "locked"; person: NearbyPerson }
    > = [];

    [...mine, ...unlocked].forEach((person, index) => {
      items.push({ kind: "person", person });
      if (!isUnlimited && (index + 1) % 6 === 0) {
        items.push({ kind: "ad", id: `ad-${index}` });
      }
    });
    locked.forEach((person) => items.push({ kind: "locked", person }));
    return items;
  }, [visible, isUnlimited]);

  function handleTap(person: NearbyPerson) {
    if (!isUnlimited && tapsUsed >= FREE_DAILY_TAPS) {
      setSelected(null);
      router.push("/membership");
      return;
    }
    if (!isUnlimited) {
      const next = tapsUsed + 1;
      setTapsUsed(next);
      localStorage.setItem(tapsStorageKey("me"), String(next));
    }
    setToast(`Tapped ${person.name}`);
    setSelected(null);
  }

  return (
    <AppChrome
      locationLabel={city || "Nearby"}
      onRefresh={() => void syncLocation()}
      refreshing={refreshing}
      onOpenFilters={() => setFiltersOpen((open) => !open)}
      gpsHint={gpsHint}
      isUnlimited={isUnlimited}
    >
      <div className="border-b border-white/10 px-2 py-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              aria-pressed={filter === item.id}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold",
                filter === item.id
                  ? "bg-[#ffc800] text-black"
                  : "bg-white/5 text-zinc-400",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setTribeFilter(null)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold",
              !tribeFilter ? "bg-white text-black" : "bg-white/5 text-zinc-400",
            )}
          >
            All tribes
          </button>
          {TRIBE_OPTIONS.map((tribe) => (
            <button
              key={tribe}
              type="button"
              onClick={() => setTribeFilter(tribeFilter === tribe ? null : tribe)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold",
                tribeFilter === tribe ? "bg-[#ffc800] text-black" : "bg-white/5 text-zinc-400",
              )}
            >
              {tribe}
            </button>
          ))}
        </div>
        {filtersOpen ? (
          <p className="px-1 pt-2 text-[11px] text-zinc-500">
            Filter by gender, tribe, or distance. Live GPS sorts the grid nearest first.
          </p>
        ) : null}
      </div>

      {!isUnlimited ? <AdSlot compact /> : null}

      {visible.length === 0 ? (
        <div className="px-6 py-20 text-center">
          <p className="text-lg font-bold">Nobody in this range</p>
          <p className="mt-2 text-sm text-zinc-400">Widen the filter or refresh your location.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[2px] sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
          {gridItems.map((item) => {
            if (item.kind === "ad") {
              return <AdSlot key={item.id} />;
            }

            const person = item.person;
            const locked = item.kind === "locked";
            return (
              <button
                key={person.id}
                type="button"
                onClick={() => {
                  if (locked) {
                    router.push("/membership");
                    return;
                  }
                  if (person.isMe) {
                    router.push("/profile");
                    return;
                  }
                  setSelected(person);
                }}
                className="group relative aspect-[4/5] overflow-hidden bg-zinc-900 text-left focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#ffc800]"
                aria-label={
                  locked
                    ? "Unlock more profiles with Unlimited"
                    : person.isMe
                      ? "Edit your profile"
                      : `Open ${person.name}${person.age ? `, ${person.age}` : ""}, ${formatDistance(person.distanceMeters)} away`
                }
              >
                {person.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={person.image}
                    alt={person.name}
                    className={cn(
                      "h-full w-full object-cover transition duration-300 group-hover:scale-105",
                      locked && "scale-110 blur-md",
                    )}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-zinc-800 text-3xl font-black text-white/50">
                    {person.name.charAt(0)}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {locked ? (
                  <div className="absolute inset-0 flex items-end bg-black/40 p-2">
                    <p className="text-[10px] font-black text-[#ffc800]">Unlock · £10/mo</p>
                  </div>
                ) : (
                  <>
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                      <span
                        className={cn(
                          "size-2 rounded-full border border-black",
                          person.isOnline ? "bg-emerald-400" : "bg-zinc-500",
                        )}
                      />
                      {person.isBoosted ? (
                        <span className="rounded bg-[#ffc800] px-1 py-px text-[9px] font-black text-black">
                          <Zap className="inline size-2.5 fill-black" />
                        </span>
                      ) : null}
                      {person.isMe ? (
                        <span className="rounded bg-white px-1 py-px text-[9px] font-black text-black">
                          ME
                        </span>
                      ) : null}
                    </div>

                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                      {(person.photos?.length ?? 0) > 1 ? (
                        <span className="rounded bg-black/60 px-1 py-px text-[9px] font-bold text-white">
                          {person.photos.length}
                        </span>
                      ) : null}
                      {!person.isMe ? (
                        <span className="rounded-full bg-black/50 p-1 text-[#ffc800]">
                          <Flame className="size-3 fill-current" />
                        </span>
                      ) : null}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-1.5 text-left">
                      <p className="truncate text-[11px] font-bold leading-none text-white">
                        {person.isMe
                          ? "Edit profile"
                          : `${person.name}${person.age ? `, ${person.age}` : ""}`}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium text-white/80">
                        {person.isMe ? "That's you" : formatDistance(person.distanceMeters)}
                      </p>
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selected ? (
        <ProfileSheet
          person={selected}
          onClose={() => setSelected(null)}
          onTap={handleTap}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#ffc800] px-4 py-2 text-sm font-bold text-black shadow-lg">
          {toast}
        </div>
      ) : null}
    </AppChrome>
  );
}
