export const MAX_PROFILE_PHOTOS = 6;

export function parsePhotos(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
  } catch {
    return value.startsWith("http") || value.startsWith("/") ? [value] : [];
  }
}

export function serializePhotos(photos: string[]): string {
  return JSON.stringify(photos.slice(0, MAX_PROFILE_PHOTOS));
}

export function photosFromUser(user: {
  image?: string | null;
  photos?: string | null;
}): string[] {
  const album = parsePhotos(user.photos);
  if (album.length > 0) return album.slice(0, MAX_PROFILE_PHOTOS);
  return user.image ? [user.image] : [];
}
