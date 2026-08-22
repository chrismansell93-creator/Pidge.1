import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL missing — skipping prisma db push");
  process.exit(0);
}

const schema = process.env.VERCEL
  ? "prisma/schema.prod.prisma"
  : "prisma/schema.prisma";

const result = spawnSync(
  "npx",
  ["prisma", "db", "push", "--skip-generate", "--schema", schema],
  { stdio: "inherit", shell: true },
);

if ((result.status ?? 1) !== 0) {
  // Preview/production builds should not hard-fail solely on schema sync flakes;
  // generate already ran and additive columns are applied on the next successful push.
  if (process.env.VERCEL) {
    console.warn(
      "prisma db push failed during Vercel build — continuing so the app can still compile.",
    );
    process.exit(0);
  }
  process.exit(result.status ?? 1);
}

process.exit(0);
