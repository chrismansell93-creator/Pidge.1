import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { FREE_DAILY_TAPS, isUnlimited } from "@/lib/membership";
import { verifyPlayPurchase } from "@/lib/play-verify";
import { adminEmails } from "@/lib/admin-emails";

describe("isUnlimited", () => {
  it("rejects non-unlimited tiers", () => {
    expect(isUnlimited("free", null)).toBe(false);
  });

  it("accepts unlimited without expiry", () => {
    expect(isUnlimited("unlimited", null)).toBe(true);
  });

  it("rejects expired unlimited", () => {
    expect(isUnlimited("unlimited", new Date(Date.now() - 60_000))).toBe(false);
  });
});

describe("adminEmails", () => {
  const originalAdmin = process.env.ADMIN_EMAILS;
  const originalVercel = process.env.VERCEL;

  afterEach(() => {
    if (originalAdmin === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = originalAdmin;
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
  });

  it("uses ADMIN_EMAILS when set", () => {
    process.env.ADMIN_EMAILS = "Owner@Example.com, other@x.com";
    process.env.VERCEL = "1";
    expect(adminEmails()).toEqual(["owner@example.com", "other@x.com"]);
  });

  it("returns no defaults on Vercel without ADMIN_EMAILS", () => {
    delete process.env.ADMIN_EMAILS;
    process.env.VERCEL = "1";
    expect(adminEmails()).toEqual([]);
  });
});

describe("verifyPlayPurchase", () => {
  const originalAccount = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  const originalBypass = process.env.PLAY_BILLING_DEV_BYPASS;
  const originalVercel = process.env.VERCEL;

  beforeEach(() => {
    delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
    delete process.env.PLAY_BILLING_DEV_BYPASS;
    delete process.env.VERCEL;
  });

  afterEach(() => {
    if (originalAccount === undefined) delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
    else process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = originalAccount;
    if (originalBypass === undefined) delete process.env.PLAY_BILLING_DEV_BYPASS;
    else process.env.PLAY_BILLING_DEV_BYPASS = originalBypass;
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
  });

  it("rejects unknown products", async () => {
    const result = await verifyPlayPurchase({
      productId: "wrong",
      purchaseToken: "token-12345678",
    });
    expect(result).toEqual({ ok: false, status: 400, error: "Unknown Play product" });
  });

  it("fails closed on Vercel without credentials", async () => {
    process.env.VERCEL = "1";
    const result = await verifyPlayPurchase({
      productId: "pidge_unlimited_monthly",
      purchaseToken: "token-12345678",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(503);
  });

  it("allows local bypass when explicitly enabled", async () => {
    process.env.PLAY_BILLING_DEV_BYPASS = "1";
    const result = await verifyPlayPurchase({
      productId: "pidge_unlimited_monthly",
      purchaseToken: "token-12345678",
    });
    expect(result).toEqual({ ok: true });
  });
});

describe("FREE_DAILY_TAPS", () => {
  it("is eight for Limited", () => {
    expect(FREE_DAILY_TAPS).toBe(8);
  });
});
