import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { monthFromNow } from "@/lib/membership";

export const STRIPE_ENABLED = Boolean(process.env.STRIPE_SECRET_KEY);

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? null;

export const UNLIMITED_PRICE_PENCE = 1000;

const CURRENCY = "gbp";

let cachedClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Stripe is not configured (missing STRIPE_SECRET_KEY)");
  }
  if (!cachedClient) {
    cachedClient = new Stripe(key);
  }
  return cachedClient;
}

export function buildCheckoutParams(opts: {
  userId: string;
  email?: string | null;
  customerId?: string | null;
  origin: string;
}): Stripe.Checkout.SessionCreateParams {
  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = STRIPE_PRICE_ID
    ? { price: STRIPE_PRICE_ID, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: UNLIMITED_PRICE_PENCE,
          recurring: { interval: "month" },
          product_data: { name: "Pidge Unlimited" },
        },
      };

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [lineItem],
    client_reference_id: opts.userId,
    metadata: { userId: opts.userId },
    subscription_data: { metadata: { userId: opts.userId } },
    success_url: `${opts.origin}/membership?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${opts.origin}/membership?checkout=cancelled`,
    allow_promotion_codes: true,
  };

  if (opts.customerId) {
    params.customer = opts.customerId;
  } else if (opts.email) {
    params.customer_email = opts.email;
  }

  return params;
}

export function verifyStripeEvent(rawBody: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Stripe webhook secret is not configured (missing STRIPE_WEBHOOK_SECRET)");
  }
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function expiryFromPeriodEnd(periodEnd: number | null | undefined): Date {
  if (typeof periodEnd === "number" && Number.isFinite(periodEnd)) {
    return new Date(periodEnd * 1000);
  }
  return monthFromNow();
}

async function resolveUserId(hints: {
  userId?: string | null;
  subscriptionId?: string | null;
  customerId?: string | null;
}): Promise<string | null> {
  if (hints.userId) {
    const byId = await prisma.user.findUnique({ where: { id: hints.userId }, select: { id: true } });
    if (byId) return byId.id;
  }
  if (hints.subscriptionId) {
    const bySub = await prisma.user.findFirst({
      where: { stripeSubscriptionId: hints.subscriptionId },
      select: { id: true },
    });
    if (bySub) return bySub.id;
  }
  if (hints.customerId) {
    const byCustomer = await prisma.user.findFirst({
      where: { stripeCustomerId: hints.customerId },
      select: { id: true },
    });
    if (byCustomer) return byCustomer.id;
  }
  return null;
}

export type StripeEventResult = {
  handled: boolean;
  action: string;
  userId?: string;
};

/**
 * Applies a verified Stripe event to a user's membership. Kept free of request
 * plumbing so it can be exercised directly in tests with a fabricated event.
 */
export async function applyStripeEventToMembership(
  event: Stripe.Event,
): Promise<StripeEventResult> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = await resolveUserId({
        userId: session.client_reference_id ?? session.metadata?.userId ?? null,
        subscriptionId: idOf(session.subscription),
        customerId: idOf(session.customer),
      });
      if (!userId) return { handled: false, action: "no_matching_user" };

      await prisma.user.update({
        where: { id: userId },
        data: {
          membershipTier: "unlimited",
          membershipExpiresAt: monthFromNow(),
          stripeCustomerId: idOf(session.customer) ?? undefined,
          stripeSubscriptionId: idOf(session.subscription) ?? undefined,
        },
      });
      return { handled: true, action: "activated", userId };
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = await resolveUserId({
        userId: subscription.metadata?.userId ?? null,
        subscriptionId: subscription.id,
        customerId: idOf(subscription.customer),
      });
      if (!userId) return { handled: false, action: "no_matching_user" };

      const active = subscription.status === "active" || subscription.status === "trialing";
      const periodEnd = (subscription as unknown as { current_period_end?: number })
        .current_period_end;
      await prisma.user.update({
        where: { id: userId },
        data: active
          ? {
              membershipTier: "unlimited",
              membershipExpiresAt: expiryFromPeriodEnd(periodEnd),
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: idOf(subscription.customer) ?? undefined,
            }
          : {
              membershipTier: "free",
              membershipExpiresAt: null,
              stripeSubscriptionId: null,
            },
      });
      return { handled: true, action: active ? "renewed" : "downgraded", userId };
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = idOf(
        (invoice as unknown as { subscription?: string | { id: string } | null }).subscription,
      );
      const userId = await resolveUserId({
        subscriptionId,
        customerId: idOf(invoice.customer),
      });
      if (!userId) return { handled: false, action: "no_matching_user" };

      const periodEnd = invoice.lines?.data?.[0]?.period?.end ?? null;
      await prisma.user.update({
        where: { id: userId },
        data: {
          membershipTier: "unlimited",
          membershipExpiresAt: expiryFromPeriodEnd(periodEnd),
        },
      });
      return { handled: true, action: "renewed", userId };
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = await resolveUserId({
        userId: subscription.metadata?.userId ?? null,
        subscriptionId: subscription.id,
        customerId: idOf(subscription.customer),
      });
      if (!userId) return { handled: false, action: "no_matching_user" };

      await prisma.user.update({
        where: { id: userId },
        data: {
          membershipTier: "free",
          membershipExpiresAt: null,
          stripeSubscriptionId: null,
        },
      });
      return { handled: true, action: "downgraded", userId };
    }

    default:
      return { handled: false, action: `ignored:${event.type}` };
  }
}
