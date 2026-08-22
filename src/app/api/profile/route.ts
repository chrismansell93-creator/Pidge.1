import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations";
import { photosFromUser, serializePhotos } from "@/lib/photos";
import { isAdminEmail } from "@/lib/admin";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      bio: true,
      city: true,
      latitude: true,
      longitude: true,
      interests: true,
      timezone: true,
      availability: true,
      name: true,
      email: true,
      image: true,
      photos: true,
      age: true,
      headline: true,
      lookingFor: true,
      gender: true,
      into: true,
      tribes: true,
      membershipTier: true,
      membershipExpiresAt: true,
    },
  });

  if (!user) return NextResponse.json({});

  return NextResponse.json({
    ...user,
    photos: photosFromUser(user),
    isAdmin: isAdminEmail(user.email),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid profile" },
      { status: 400 },
    );
  }

  const {
    name,
    bio,
    city,
    latitude,
    longitude,
    interests,
    timezone,
    availability,
    age,
    headline,
    lookingFor,
    gender,
    into,
    tribes,
    image,
    photos,
  } = parsed.data;

  const album = photos && photos.length > 0 ? photos : image ? [image] : [];
  const cover = album[0] ?? image ?? undefined;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name ?? undefined,
      bio: bio ?? null,
      city: city ?? null,
      latitude,
      longitude,
      interests: interests ?? null,
      timezone: timezone ?? null,
      availability: availability ?? null,
      age,
      headline: headline ?? null,
      lookingFor: lookingFor ?? null,
      gender: gender || null,
      into: into || null,
      tribes: tribes || null,
      image: cover,
      photos: serializePhotos(album),
      profileComplete: true,
    },
  });

  return NextResponse.json({ ok: true, user }, { status: 200 });
}
