import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ORIGIN,
  haversineMeters,
  sortNearby,
  type NearbyPerson,
} from "@/lib/geo";
import { photosFromUser } from "@/lib/photos";
import { requireActiveUser } from "@/lib/active-user";

export async function GET(req: Request) {
  const active = await requireActiveUser();
  if (active.error) return active.error;

  const url = new URL(req.url);
  const queryLat = url.searchParams.get("lat");
  const queryLng = url.searchParams.get("lng");

  const me = await prisma.user.findUnique({
    where: { id: active.user.id },
  });

  if (!me || me.deletedAt) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const requestedOrigin =
    queryLat && queryLng
      ? { latitude: Number(queryLat), longitude: Number(queryLng) }
      : null;

  const others = await prisma.user.findMany({
    where: {
      id: { not: me.id },
      profileComplete: true,
      deletedAt: null,
      latitude: { not: null },
      longitude: { not: null },
    },
  });

  const savedOrigin = {
    latitude: me.latitude ?? DEFAULT_ORIGIN.latitude,
    longitude: me.longitude ?? DEFAULT_ORIGIN.longitude,
  };

  const closestFromRequest = requestedOrigin
    ? Math.min(
        ...others.map((user) =>
          user.latitude != null && user.longitude != null
            ? haversineMeters(
                requestedOrigin.latitude,
                requestedOrigin.longitude,
                user.latitude,
                user.longitude,
              )
            : Number.POSITIVE_INFINITY,
        ),
      )
    : Number.POSITIVE_INFINITY;

  const usingLiveGps = Boolean(requestedOrigin) && closestFromRequest < 80_000;
  const origin = usingLiveGps && requestedOrigin ? requestedOrigin : savedOrigin;

  const mePhotos = photosFromUser(me);
  const meCard: NearbyPerson = {
    id: me.id,
    name: me.name ?? "You",
    age: me.age,
    image: mePhotos[0] ?? me.image,
    photos: mePhotos,
    bio: me.bio,
    city: me.city,
    headline: me.headline,
    lookingFor: me.lookingFor,
    gender: me.gender,
    into: me.into,
    tribes: me.tribes,
    interests: me.interests,
    isOnline: true,
    isBoosted: me.isBoosted,
    lastActiveAt: new Date().toISOString(),
    distanceMeters: 0,
    isMe: true,
  };

  const people: NearbyPerson[] = others.map((user) => {
    const photos = photosFromUser(user);
    return {
      id: user.id,
      name: user.name ?? "Someone nearby",
      age: user.age,
      image: photos[0] ?? user.image,
      photos,
      bio: user.bio,
      city: user.city,
      headline: user.headline,
      lookingFor: user.lookingFor,
      gender: user.gender,
      into: user.into,
      tribes: user.tribes,
      interests: user.interests,
      isOnline: user.isOnline,
      isBoosted: user.isBoosted,
      lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
      distanceMeters:
        user.latitude != null && user.longitude != null
          ? haversineMeters(origin.latitude, origin.longitude, user.latitude, user.longitude)
          : null,
    };
  });

  return NextResponse.json({
    origin,
    city: me.city,
    usingLiveGps,
    me: meCard,
    people: sortNearby([meCard, ...people]),
  });
}
