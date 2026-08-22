import { prisma } from "@/lib/prisma";
import { photosFromUser } from "@/lib/photos";
import { isUnlimited } from "@/lib/membership";

const DAY_MS = 24 * 60 * 60 * 1000;
const FRESH_WINDOW_MS = 90 * 60 * 1000;

export type ActivityPoint = { day: string; label: string; signups: number; messages: number };

export type ReportRow = {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reporter: { id: string; name: string } | null;
  target: { id: string; name: string; image: string | null; suspended: boolean } | null;
};

export type MemberRow = {
  id: string;
  name: string;
  email: string | null;
  city: string | null;
  image: string | null;
  age: number | null;
  tier: string;
  unlimited: boolean;
  isOnline: boolean;
  isBoosted: boolean;
  suspended: boolean;
  createdAt: string;
  lastActiveAt: string | null;
};

export type SiteOverview = {
  stats: {
    totalMembers: number;
    onlineNow: number;
    activeRecently: number;
    newToday: number;
    newThisWeek: number;
    unlimitedMembers: number;
    boostedMembers: number;
    suspendedMembers: number;
    conversations: number;
    messages: number;
    messagesToday: number;
    meetups: number;
    openReports: number;
  };
  activity: ActivityPoint[];
  reports: ReportRow[];
  members: MemberRow[];
  generatedAt: string;
};

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getSiteOverview(): Promise<SiteOverview> {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - DAY_MS);
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const freshCutoff = new Date(now.getTime() - FRESH_WINDOW_MS);

  const live = { deletedAt: null } as const;

  const [
    totalMembers,
    onlineNow,
    activeRecently,
    newToday,
    newThisWeek,
    boostedMembers,
    suspendedMembers,
    conversations,
    messages,
    messagesToday,
    meetups,
    openReports,
    unlimitedCandidates,
    signupTimestamps,
    messageTimestamps,
    reportRows,
    memberRows,
  ] = await Promise.all([
    prisma.user.count({ where: live }),
    prisma.user.count({ where: { ...live, isOnline: true } }),
    prisma.user.count({ where: { ...live, lastActiveAt: { gte: freshCutoff } } }),
    prisma.user.count({ where: { ...live, createdAt: { gte: dayAgo } } }),
    prisma.user.count({ where: { ...live, createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { ...live, isBoosted: true } }),
    prisma.user.count({ where: { deletedAt: { not: null } } }),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.message.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.meetupRequest.count(),
    prisma.report.count(),
    prisma.user.findMany({
      where: { ...live, membershipTier: "unlimited" },
      select: { membershipTier: true, membershipExpiresAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { createdAt: true },
    }),
    prisma.message.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { createdAt: true },
    }),
    prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        reporter: { select: { id: true, name: true } },
        target: {
          select: { id: true, name: true, image: true, photos: true, deletedAt: true },
        },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        image: true,
        photos: true,
        age: true,
        membershipTier: true,
        membershipExpiresAt: true,
        isOnline: true,
        isBoosted: true,
        deletedAt: true,
        createdAt: true,
        lastActiveAt: true,
      },
    }),
  ]);

  const unlimitedMembers = unlimitedCandidates.filter((user) =>
    isUnlimited(user.membershipTier, user.membershipExpiresAt),
  ).length;

  // Bucket the last 7 days (oldest -> newest) for the traffic charts.
  const buckets = new Map<string, { signups: number; messages: number }>();
  const days: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * DAY_MS);
    const key = dayKey(d);
    days.push(key);
    buckets.set(key, { signups: 0, messages: 0 });
  }
  for (const row of signupTimestamps) {
    const bucket = buckets.get(dayKey(row.createdAt));
    if (bucket) bucket.signups += 1;
  }
  for (const row of messageTimestamps) {
    const bucket = buckets.get(dayKey(row.createdAt));
    if (bucket) bucket.messages += 1;
  }
  const activity: ActivityPoint[] = days.map((key) => {
    const bucket = buckets.get(key)!;
    return {
      day: key,
      label: new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", {
        weekday: "short",
      }),
      signups: bucket.signups,
      messages: bucket.messages,
    };
  });

  const reports: ReportRow[] = reportRows.map((row) => ({
    id: row.id,
    reason: row.reason,
    details: row.details,
    createdAt: row.createdAt.toISOString(),
    reporter: row.reporter ? { id: row.reporter.id, name: row.reporter.name ?? "Unknown" } : null,
    target: row.target
      ? {
          id: row.target.id,
          name: row.target.name ?? "Unknown",
          image: photosFromUser(row.target)[0] ?? row.target.image ?? null,
          suspended: Boolean(row.target.deletedAt),
        }
      : null,
  }));

  const members: MemberRow[] = memberRows.map((user) => ({
    id: user.id,
    name: user.name ?? "Unnamed",
    email: user.email,
    city: user.city,
    image: photosFromUser(user)[0] ?? user.image ?? null,
    age: user.age,
    tier: user.membershipTier,
    unlimited: isUnlimited(user.membershipTier, user.membershipExpiresAt),
    isOnline: user.isOnline,
    isBoosted: user.isBoosted,
    suspended: Boolean(user.deletedAt),
    createdAt: user.createdAt.toISOString(),
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
  }));

  return {
    stats: {
      totalMembers,
      onlineNow,
      activeRecently,
      newToday,
      newThisWeek,
      unlimitedMembers,
      boostedMembers,
      suspendedMembers,
      conversations,
      messages,
      messagesToday,
      meetups,
      openReports,
    },
    activity,
    reports,
    members,
    generatedAt: now.toISOString(),
  };
}
