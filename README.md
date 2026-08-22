# Pidge

Location dating app. Adults 18+. Domain: [www.pidge.dating](https://www.pidge.dating).

Limited is free (50 nearby profiles, ads, 8 taps a day). Unlimited is £10/month through **Google Play only**.

## Run locally

```bash
cd C:\Users\chris\Pidge.1
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Open http://localhost:3000

## Production env

Set these in the Vercel project (Settings → Environment Variables):

```
DATABASE_URL="<postgres url from Vercel Postgres>"
AUTH_SECRET="<generate with npx auth secret>"
AUTH_URL="https://www.pidge.dating"
NEXT_PUBLIC_APP_URL="https://www.pidge.dating"
PLAY_PRODUCT_ID="pidge_unlimited_monthly"
ADMIN_EMAILS="you@example.com"
BLOB_READ_WRITE_TOKEN="<from Vercel Blob store>"
GOOGLE_PLAY_PACKAGE_NAME="com.pidge.myapp"
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON="<Play Console API service-account JSON>"
```

`ADMIN_EMAILS` is required in production (no hardcoded owners). `BLOB_READ_WRITE_TOKEN` is required for profile photos on Vercel. Play Unlimited grants are refused until `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` is set.

After the first deploy, seed the production database once (from a machine with `DATABASE_URL` set to the prod Postgres URL):

```bash
SEED_WIPE=0 npx prisma db push --schema=prisma/schema.prod.prisma
SEED_WIPE=0 npx prisma db seed
```

Never run the seed against production without `SEED_WIPE=0`.

## Android / Play Store

Web host is live at [www.pidge.dating](https://www.pidge.dating). Sync and open Android Studio:

```bash
npx cap sync android
npx cap open android
```

Then generate a signed App Bundle (.aab).

- Package: `com.pidge.myapp`
- Subscription: `pidge_unlimited_monthly` (£10 / month)
- Icons: `store/play/`
- Listing copy: `store/play/LISTING.md`
- Full Play notes: `PLAY_STORE.md`

For a LAN device test against a local Next server, set `NEXT_PUBLIC_APP_URL` to your LAN URL and run `npx cap sync android`.

## Legal

- /privacy
- /terms
- /safety
- /community
- /support
