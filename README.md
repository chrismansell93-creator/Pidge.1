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
```

After the first deploy, seed the production database once (from a machine with `DATABASE_URL` set to the prod Postgres URL):

```bash
npx prisma db push --schema=prisma/schema.prod.prisma
npx prisma db seed
```

## Android / Play Store

### Local build (Android Studio)

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

### EAS Build (cloud)

This project is configured for [EAS Build](https://docs.expo.dev/build/introduction/) so the Android app can be built without Android Studio.

Prerequisites:

1. Install the EAS CLI globally:

   ```bash
   npm install --global eas-cli
   ```

2. Log in to your Expo account:

   ```bash
   eas login
   ```

3. Link the project to your Expo account (creates/updates `eas.json`):

   ```bash
   eas init
   ```

Build commands:

```bash
# Internal preview APK
eas build --platform android --profile preview

# Production AAB for Play Store
eas build --platform android --profile production

# Production AAB with automatic Play Store submission
eas build --platform android --profile production --auto-submit
```

Upload credentials are managed through EAS (`eas credentials`). For Play Store release, configure the upload keystore there and set `buildType` to `app-bundle` in the `production` profile in `eas.json`.

## Legal

- /privacy
- /terms
- /safety
- /community
- /support
