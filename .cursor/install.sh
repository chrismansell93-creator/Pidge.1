#!/usr/bin/env bash
# Idempotent Cloud Agent install for Pidge (meet-now).
# Prepares dependencies, a local SQLite database, and seed data so the
# Next.js dev server and production build work out of the box.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

# .env is gitignored; create a local development file if one is not present.
if [ ! -f .env ]; then
  echo "Creating local .env for development"
  secret="$(openssl rand -base64 32 2>/dev/null \
    || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
  cat > .env <<EOF
DATABASE_URL="file:./dev.db"
AUTH_SECRET="$secret"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
PLAY_PRODUCT_ID="pidge_unlimited_monthly"
EOF
fi

# Install dependencies from the lockfile (postinstall runs `prisma generate`).
npm ci

# Apply the schema to the local SQLite DB and (re)seed demo profiles.
# `prisma` loads .env itself; export DATABASE_URL so the guarded scripts and
# the seed also see it when invoked directly.
export DATABASE_URL="file:./dev.db"
npx prisma db push --skip-generate --schema prisma/schema.prisma
npx tsx prisma/seed.ts

echo "Pidge install complete."
