# Pidge

Location dating app. Adults 18+. Domain: [www.pidge.dating](https://www.pidge.dating).

Limited is free (50 nearby profiles, ads, 8 taps a day). Unlimited is £10/month, billed through **Google Play** in the Android app and by **card via Stripe** on the web.

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
DATABASE_URL="file:./dev.db"
AUTH_SECRET="<generate with npx auth secret>"
AUTH_URL="https://www.pidge.dating"
NEXT_PUBLIC_APP_URL="https://www.pidge.dating"
PLAY_PRODUCT_ID="pidge_unlimited_monthly"

# Stripe (web card payments). Card payments are disabled until STRIPE_SECRET_KEY is set.
STRIPE_SECRET_KEY="sk_live_..."          # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET="whsec_..."        # from the webhook endpoint below
STRIPE_PRICE_ID="price_..."              # optional; omit to use an inline £10/month price
```

## Stripe card payments

On the web (non-Android), the Membership page offers **Pay by card**, which opens
Stripe Checkout for the £10/month Unlimited subscription.

- Checkout session: `POST /api/membership/stripe/checkout` (returns a Checkout URL).
- Fulfilment webhook: `POST /api/membership/stripe/webhook`. Point a Stripe webhook
  at `https://www.pidge.dating/api/membership/stripe/webhook` and subscribe to
  `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`, and `invoice.payment_succeeded`. Use the signing
  secret it gives you as `STRIPE_WEBHOOK_SECRET`.
- Downgrading to Limited cancels the Stripe subscription automatically.

The Android app continues to use Google Play billing (store policy), so the card
button is shown only on the web.

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
