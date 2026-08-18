# Pidge — Google Play listing

Pidge is an 18+ location dating app. Unlimited is a Google Play subscription (`pidge_unlimited_monthly`, £10 / month). There is no Stripe or in-app card form.

Paste-ready listing copy is in `store/play/LISTING.md`.

## Store listing

- **App name:** Pidge
- **Short description:** Meet adults nearby. 18+ location grid.
- **Full description:** see `store/play/LISTING.md`

- **Category:** Dating
- **Content rating:** Adults only (18+)
- **Package:** `app.pidge.android`

## Required Play Console answers

- Users can create accounts → yes
- Account deletion → Me → Delete account, and /support
- Location → precise, while in use, to sort nearby people
- Payments → Google Play Billing only, product `pidge_unlimited_monthly`
- Ads → yes, first-party upgrade adverts on Limited
- Target audience → 18+
- Privacy policy URL → `https://www.pidge.dating/privacy`
- Terms URL → `https://www.pidge.dating/terms`

## Play Store logo files

Upload from `store/play/`:

- **App icon:** `icon-512.png` (512×512)
- **Feature graphic:** `feature-graphic-1024x500.png` (1024×500)
- **Promo graphic (optional):** `promo-180x120.png` (180×120)
- **Master:** `icon-1024.png`

Android launcher set is in `store/android/` (mdpi–xxxhdpi, round, adaptive, notification). Copy those into the Capacitor `android/app/src/main/res/` mipmap folders after `npx cap add android`.

Regenerate with `node scripts/generate-play-icons.mjs`.

## Build the Android app

1. Host this Next.js app at `https://www.pidge.dating` and set `NEXT_PUBLIC_APP_URL` and `AUTH_URL` to that URL.
2. In Play Console create a subscription product: `pidge_unlimited_monthly` / £10 / month.
3. The Android project is already in `android/`. Open it:

```bash
cd C:\Users\chris\Pidge.1
npm install
npx cap sync android
npx cap open android
```

4. In Android Studio generate a Play App Signing key and build an **Android App Bundle (.aab)**.
5. Play Billing is wired: product `pidge_unlimited_monthly`. Create that subscription in Play Console before testing purchases.

## Data safety form (short)

- Collected: email, name, date of birth, photos, approximate and precise location, purchase history
- Shared: profile content with other users; payments with Google
- Encrypted in transit: yes
- Users can request deletion: yes
