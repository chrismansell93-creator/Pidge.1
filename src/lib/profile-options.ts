export const GENDER_OPTIONS = [
  "Man",
  "Woman",
  "Non-binary",
  "Trans",
  "Trans man",
  "Trans woman",
  "Transmasculine",
  "Transfeminine",
  "Genderqueer",
  "Genderfluid",
  "Agender",
  "Intersex",
  "Two-spirit",
  "Questioning",
  "Prefer not to say",
] as const;

export const INTO_OPTIONS = [
  "Men",
  "Women",
  "Trans men",
  "Trans women",
  "Non-binary people",
  "Everyone",
] as const;

export const TRIBE_OPTIONS = [
  "Bear",
  "Cub",
  "Daddy",
  "Twink",
  "Twunk",
  "Otter",
  "Wolf",
  "Jock",
  "Geek",
  "Rugged",
  "Clean-cut",
  "Leather",
  "Discrete",
  "Poz",
  "Sober",
  "Queer",
  "Trans",
] as const;

export const MAX_TRIBES = 4;

export type GenderOption = (typeof GENDER_OPTIONS)[number];
export type IntoOption = (typeof INTO_OPTIONS)[number];
export type TribeOption = (typeof TRIBE_OPTIONS)[number];

export function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatList(values: string[]): string {
  const unique = [...new Set(values.map((item) => item.trim()).filter(Boolean))];
  if (unique.includes("Everyone")) return "Everyone";
  return unique.join(", ");
}

export function hasTribe(tribes: string | null | undefined, tribe: string): boolean {
  return parseList(tribes).some((item) => item.toLowerCase() === tribe.toLowerCase());
}

export function matchesGenderFilter(
  gender: string | null | undefined,
  filter: "men" | "women" | "nb" | "trans",
  tribes?: string | null,
): boolean {
  if (filter === "trans") {
    const transGenders = new Set([
      "Trans",
      "Trans man",
      "Trans woman",
      "Transmasculine",
      "Transfeminine",
    ]);
    return Boolean(gender && transGenders.has(gender)) || hasTribe(tribes, "Trans");
  }
  if (!gender) return false;
  if (filter === "men") return gender === "Man" || gender === "Trans man" || gender === "Transmasculine";
  if (filter === "women") return gender === "Woman" || gender === "Trans woman" || gender === "Transfeminine";
  return ["Non-binary", "Genderqueer", "Genderfluid", "Agender"].includes(gender);
}
