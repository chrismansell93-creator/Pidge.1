import { z } from "zod";

function yearsOld(isoDate: string): number {
  const born = new Date(isoDate);
  if (Number.isNaN(born.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const month = now.getMonth() - born.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < born.getDate())) age -= 1;
  return age;
}

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    dateOfBirth: z.string().min(1, "Enter your date of birth"),
    acceptedTerms: z
      .boolean()
      .refine((value) => value === true, "You must accept the terms and confirm you are 18+"),
  })
  .refine((data) => yearsOld(data.dateOfBirth) >= 18, {
    message: "You must be 18 or older to use Pidge",
    path: ["dateOfBirth"],
  });

export const reportSchema = z.object({
  targetId: z.string().min(1),
  reason: z.enum(["spam", "harassment", "underage", "hate", "nudity", "other"]),
  details: z.string().max(500).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(40).optional(),
  bio: z.string().max(240, "Bio must be 240 characters or fewer").optional(),
  city: z.string().max(80).optional(),
  latitude: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().min(-90).max(90).optional(),
  ),
  longitude: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().min(-180).max(180).optional(),
  ),
  interests: z.string().max(200).optional(),
  timezone: z.string().max(80).optional(),
  availability: z.string().max(200).optional(),
  age: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().int().min(18).max(99).optional(),
  ),
  headline: z.string().max(80).optional(),
  lookingFor: z.string().max(80).optional(),
  gender: z.string().max(40).optional(),
  into: z.string().max(120).optional(),
  tribes: z.string().max(160).optional(),
  image: z.union([z.string().url(), z.literal(""), z.string().startsWith("/uploads/")]).optional(),
  photos: z
    .array(
      z.string().refine(
        (value) =>
          value.startsWith("/uploads/") ||
          value.startsWith("https://") ||
          value.startsWith("http://"),
        "Each photo must be a URL or uploaded image",
      ),
    )
    .max(6, "You can add up to 6 photos")
    .optional(),
});

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  city: z.string().max(80).optional(),
});

export const meetupSchema = z.object({
  title: z.string().min(2, "Title is required").max(80),
  summary: z.string().min(10, "Please add a bit more detail").max(500),
  date: z.string().min(1, "Pick a date"),
  time: z.string().min(1, "Pick a time"),
  location: z.string().max(120).optional(),
  type: z.enum(["coffee", "walk", "virtual", "networking"]).default("coffee"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type MeetupInput = z.infer<typeof meetupSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
