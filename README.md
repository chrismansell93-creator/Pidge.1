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

Seeded demo login (local only): `test@example.com` / `password123`.

## Production env

```
DATABASE_URL="<your production database url>"
AUTH_SECRET="<generate with npx auth secret>"
AUTH_URL="https://www.pidge.dating"
NEXT_PUBLIC_APP_URL="https://www.pidge.dating"
PLAY_PRODUCT_ID="pidge_unlimited_monthly"
ADMIN_EMAILS="you@example.com"
```

`ADMIN_EMAILS` is required in production (comma-separated). Without it, nobody can open `/dashboard`.

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
