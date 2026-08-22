#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for the Pidge (meet-now) Next.js app.
# Installs dependencies, provisions the local SQLite database, and seeds it.
set -euo pipefail

cd "$(dirname "$0")/.."

# Provide dev-only local config if none is present. These are non-sensitive
# local development values: a file-backed SQLite database and a throwaway
# AUTH_SECRET used only to sign local NextAuth sessions.
if [ ! -f .env ]; then
  cat > .env <<'EOF'
DATABASE_URL="file:./dev.db"
AUTH_SECRET="dev-only-local-secret-not-for-production-0123456789abcdef"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
PLAY_PRODUCT_ID="pidge_unlimited_monthly"
EOF
fi

# Deterministic install from the lockfile. postinstall runs `prisma generate`.
npm ci

# Sync the SQLite schema and seed sample profiles. Both are idempotent:
# `db push` reconciles the schema, and the seed uses upserts.
npx prisma db push --schema prisma/schema.prisma --skip-generate
npx prisma db seed
