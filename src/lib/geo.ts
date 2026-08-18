export type NearbyPerson = {
  id: string;
  name: string;
  age: number | null;
  image: string | null;
  photos: string[];
  bio: string | null;
  city: string | null;
  headline: string | null;
  lookingFor: string | null;
  gender: string | null;
  into: string | null;
  tribes: string | null;
  interests: string | null;
  isOnline: boolean;
  isBoosted: boolean;
  lastActiveAt: string | null;
  distanceMeters: number | null;
  isMe?: boolean;
};

export type GeoOrigin = {
  latitude: number;
  longitude: number;
};

export const DEFAULT_ORIGIN: GeoOrigin = {
  latitude: 51.513,
  longitude: -0.131,
};

export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number | null): string {
  if (meters == null || Number.isNaN(meters)) return "Distance unavailable";
  if (meters < 25) return "Here";
  if (meters < 1000) return `${Math.round(meters)} m`;

  const kilometers = meters / 1000;
  if (kilometers < 10) return `${kilometers.toFixed(2)} km`;
  if (kilometers < 100) return `${kilometers.toFixed(1)} km`;
  return `${Math.round(kilometers)} km`;
}

export function isFresh(lastActiveAt: string | Date | null | undefined): boolean {
  if (!lastActiveAt) return false;
  const ts = lastActiveAt instanceof Date ? lastActiveAt.getTime() : Date.parse(lastActiveAt);
  return Date.now() - ts < 1000 * 60 * 90;
}

export function sortNearby(people: NearbyPerson[]): NearbyPerson[] {
  return [...people].sort((a, b) => {
    if (a.isMe !== b.isMe) return a.isMe ? -1 : 1;
    const da = a.distanceMeters ?? Number.POSITIVE_INFINITY;
    const db = b.distanceMeters ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    if (a.isBoosted !== b.isBoosted) return a.isBoosted ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
