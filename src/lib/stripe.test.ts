// @vitest-environment node
import { afterAll, describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { isUnlimited } from "@/lib/membership";
import {
  applyStripeEventToMembership,
  buildCheckoutParams,
  getStripe,
  verifyStripeEvent,
} from "@/lib/stripe";

const createdUserIds: string[] = [];

async function createFreeUser() {
  const user = await prisma.user.create({
    data: {
      name: "Stripe Test",
      email: `stripe-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      membershipTier: "free",
      ageConfirmed: true,
    },
  });
  createdUserIds.push(user.id);
  return user;
}

afterAll(async () => {
  if (createdUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  await prisma.$disconnect();
});

describe("buildCheckoutParams", () => {
  it("creates a monthly subscription session with return URLs", () => {
    const params = buildCheckoutParams({
      userId: "user_123",
      email: "buyer@example.com",
      customerId: null,
      origin: "https://www.pidge.dating",
    });

    expect(params.mode).toBe("subscription");
    expect(params.client_reference_id).toBe("user_123");
    expect(params.metadata?.userId).toBe("user_123");
    expect(params.customer_email).toBe("buyer@example.com");
    expect(params.success_url).toContain("https://www.pidge.dating/membership?checkout=success");
    expect(params.cancel_url).toContain("checkout=cancelled");

    const lineItem = params.line_items?.[0];
    // Falls back to inline price_data when STRIPE_PRICE_ID is unset.
    expect(lineItem?.price_data?.currency).toBe("gbp");
    expect(lineItem?.price_data?.unit_amount).toBe(1000);
    expect(lineItem?.price_data?.recurring?.interval).toBe("month");
  });

  it("prefers an existing customer id over an email", () => {
    const params = buildCheckoutParams({
      userId: "user_123",
      email: "buyer@example.com",
      customerId: "cus_existing",
      origin: "https://www.pidge.dating",
    });
    expect(params.customer).toBe("cus_existing");
    expect(params.customer_email).toBeUndefined();
  });
});

describe("verifyStripeEvent", () => {
  it("accepts a correctly signed payload and rejects a tampered one", () => {
    const stripe = getStripe();
    const payload = JSON.stringify({
      id: "evt_test",
      object: "event",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test" } },
    });
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET as string,
    });

    const event = verifyStripeEvent(payload, header);
    expect(event.type).toBe("checkout.session.completed");

    expect(() => verifyStripeEvent(payload + "tampered", header)).toThrow();
  });
});

describe("applyStripeEventToMembership", () => {
  it("activates Unlimited on checkout.session.completed", async () => {
    const user = await createFreeUser();

    const event = {
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          object: "checkout.session",
          client_reference_id: user.id,
          customer: "cus_test_1",
          subscription: "sub_test_1",
          metadata: { userId: user.id },
        },
      },
    } as unknown as Stripe.Event;

    const result = await applyStripeEventToMembership(event);
    expect(result).toMatchObject({ handled: true, action: "activated", userId: user.id });

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.membershipTier).toBe("unlimited");
    expect(updated?.stripeSubscriptionId).toBe("sub_test_1");
    expect(updated?.stripeCustomerId).toBe("cus_test_1");
    expect(isUnlimited(updated?.membershipTier, updated?.membershipExpiresAt)).toBe(true);
  });

  it("downgrades to free on customer.subscription.deleted", async () => {
    const user = await createFreeUser();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        membershipTier: "unlimited",
        membershipExpiresAt: new Date(Date.now() + 30 * 864e5),
        stripeSubscriptionId: "sub_test_2",
        stripeCustomerId: "cus_test_2",
      },
    });

    const event = {
      id: "evt_2",
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_test_2",
          object: "subscription",
          customer: "cus_test_2",
          status: "canceled",
          metadata: { userId: user.id },
        },
      },
    } as unknown as Stripe.Event;

    const result = await applyStripeEventToMembership(event);
    expect(result).toMatchObject({ handled: true, action: "downgraded", userId: user.id });

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.membershipTier).toBe("free");
    expect(updated?.membershipExpiresAt).toBeNull();
    expect(updated?.stripeSubscriptionId).toBeNull();
  });

  it("ignores unrelated event types", async () => {
    const event = {
      id: "evt_3",
      type: "payment_intent.created",
      data: { object: {} },
    } as unknown as Stripe.Event;
    const result = await applyStripeEventToMembership(event);
    expect(result.handled).toBe(false);
  });
});
