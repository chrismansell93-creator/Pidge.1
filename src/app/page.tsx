import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { GeoGrid } from "@/components/geo-grid";
import {
  DEFAULT_ORIGIN,
  haversineMeters,
  sortNearby,
  type NearbyPerson,
} from "@/lib/geo";
import { photosFromUser } from "@/lib/photos";
import { isUnlimited } from "@/lib/membership";
import { requirePageUser } from "@/lib/active-user";

export default async function Home() {
  const active = await requirePageUser();

  const me = await prisma.user.findUnique({
    where: { id: active.id },
  });
  if (!me) redirect("/login");

  const origin = {
    latitude: me.latitude ?? DEFAULT_ORIGIN.latitude,
    longitude: me.longitude ?? DEFAULT_ORIGIN.longitude,
  };

  const others = await prisma.user.findMany({
    where: {
      id: { not: me.id },
      profileComplete: true,
      deletedAt: null,
      latitude: { not: null },
      longitude: { not: null },
    },
  });

  const mePhotos = photosFromUser(me);
  const initialPeople: NearbyPerson[] = sortNearby([
    {
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
    },
    ...others.map((user) => {
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
    }),
  ]);

  return (
    <GeoGrid
      initialPeople={initialPeople}
      initialCity={me.city}
      initialUnlimited={isUnlimited(me.membershipTier, me.membershipExpiresAt)}
    />
  );
}
