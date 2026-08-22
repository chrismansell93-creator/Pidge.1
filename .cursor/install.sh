#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for the Pidge (meet-now) Next.js app.
# Installs dependencies, provisions the local SQLite database, and seeds it.
set -euo pipefail

cd "$(dirname "$0")/.."

# Provide dev-only local config if none is present. AUTH_SECRET is generated
# per environment so local sessions are not signed with a shared known value.
if [ ! -f .env ]; then
  secret="$(openssl rand -base64 32 2>/dev/null \
    || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
  cat > .env <<EOF
DATABASE_URL="file:./dev.db"
AUTH_SECRET="${secret}"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
PLAY_PRODUCT_ID="pidge_unlimited_monthly"
# Optional comma-separated admin allowlist. Unset in local/dev falls back to
# the seeded owner test@example.com. In production, ADMIN_EMAILS is required.
# ADMIN_EMAILS="you@example.com"
EOF
fi

# Deterministic install from the lockfile. postinstall runs `prisma generate`.
npm ci

# Sync the SQLite schema and seed sample profiles. Both are idempotent:
# `db push` reconciles the schema, and the seed uses upserts.
export DATABASE_URL="${DATABASE_URL:-file:./dev.db}"
npx prisma db push --schema prisma/schema.prisma --skip-generate
npx prisma db seed
