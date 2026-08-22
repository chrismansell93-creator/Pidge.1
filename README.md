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

```
DATABASE_URL="<postgres connection string, e.g. from your Postgres provider>"
AUTH_SECRET="<generate with npx auth secret>"
AUTH_URL="https://www.pidge.dating"
NEXT_PUBLIC_APP_URL="https://www.pidge.dating"
PLAY_PRODUCT_ID="pidge_unlimited_monthly"
ADMIN_EMAILS="<comma-separated site owner emails>"
```

`DATABASE_URL` must point at Postgres in production — `prisma/schema.prod.prisma` is used automatically whenever `VERCEL` is set (see `scripts/prisma-push.mjs`). The local SQLite file (`file:./dev.db`) is for `npm run dev` only.

## Going live checklist

The app builds and runs correctly today, but these steps happen outside this repo and need a human with the right dashboard access:

1. **Database** — provision a production Postgres instance and set `DATABASE_URL` to it in Vercel (Project Settings → Environment Variables). Run against `prisma/schema.prod.prisma`.
2. **Domain** — point `www.pidge.dating` DNS at Vercel and add/verify the domain in the Vercel project.
3. **Secrets** — set `AUTH_SECRET` (generate with `npx auth secret`), `AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `PLAY_PRODUCT_ID`, and `ADMIN_EMAILS` as production env vars in Vercel. Without `ADMIN_EMAILS`, nobody can open `/dashboard`.
4. **Google Play** — create the `pidge_unlimited_monthly` (£10/month) subscription product in Play Console before testing purchases; see `PLAY_STORE.md`.
5. **Deploy** — merge to `main` (or trigger a deploy) once the above env vars are set; `npm run build` runs `prisma generate` + `prisma db push` against the production schema automatically.
6. **Android build** — after the site is live at its real domain, rebuild and re-sign the Android app bundle (`npx cap sync android`) so the packaged app points at production, then submit/update the Play Store listing.

## Android / Play Store

```bash
npx cap sync android
npx cap open android
```

Then in Android Studio: Generate Signed App Bundle (.aab).

- Package: `com.pidge.myapp`
- Subscription: `pidge_unlimited_monthly` (£10 / month)
- Icons: `store/play/`
- Listing copy: `store/play/LISTING.md`
- Full Play notes: `PLAY_STORE.md`

Until www.pidge.dating is live, the packaged app has no host. For a device test, set `NEXT_PUBLIC_APP_URL` to your LAN URL and run `npx cap sync android`.

## Legal

- /privacy
- /terms
- /safety
- /community
- /support
