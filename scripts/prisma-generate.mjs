import { spawnSync } from "node:child_process";

const schema = process.env.VERCEL
  ? "prisma/schema.prod.prisma"
  : "prisma/schema.prisma";

const result = spawnSync("npx", ["prisma", "generate", "--schema", schema], {
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
