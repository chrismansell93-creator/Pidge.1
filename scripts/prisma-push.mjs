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

process.exit(result.status ?? 1);
