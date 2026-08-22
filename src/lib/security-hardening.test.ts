import { describe, expect, it, afterEach } from "vitest";
import { normalizeEmail } from "@/lib/email";
import { adminEmails, isAdminEmail } from "@/lib/admin-config";
import { redactTelemetryUrl, telemetryBeforeSend } from "@/lib/telemetry";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Test@Example.COM ")).toBe("test@example.com");
  });
});

describe("adminEmails", () => {
  const originalAdmin = process.env.ADMIN_EMAILS;
  const originalForce = process.env.PIDGE_FORCE_PROD_ADMIN;

  afterEach(() => {
    if (originalAdmin === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = originalAdmin;
    if (originalForce === undefined) delete process.env.PIDGE_FORCE_PROD_ADMIN;
    else process.env.PIDGE_FORCE_PROD_ADMIN = originalForce;
  });

  it("uses ADMIN_EMAILS when set", () => {
    process.env.ADMIN_EMAILS = "Owner@Site.com, other@site.com";
    expect(adminEmails()).toEqual(["owner@site.com", "other@site.com"]);
    expect(isAdminEmail("OWNER@site.com")).toBe(true);
  });

  it("fails closed in production without ADMIN_EMAILS", () => {
    delete process.env.ADMIN_EMAILS;
    process.env.PIDGE_FORCE_PROD_ADMIN = "1";
    expect(adminEmails()).toEqual([]);
    expect(isAdminEmail("test@example.com")).toBe(false);
  });

  it("allows seeded owner in non-production when unset", () => {
    delete process.env.ADMIN_EMAILS;
    delete process.env.PIDGE_FORCE_PROD_ADMIN;
    expect(adminEmails()).toEqual(["test@example.com"]);
    expect(isAdminEmail("Test@Example.com")).toBe(true);
  });
});

describe("telemetry redaction", () => {
  it("strips inbox ids and query strings", () => {
    expect(redactTelemetryUrl("https://www.pidge.dating/inbox/abc123?x=1")).toBe(
      "https://www.pidge.dating/inbox/[id]",
    );
  });

  it("rewrites beforeSend payloads", () => {
    const next = telemetryBeforeSend({
      url: "https://www.pidge.dating/api/chats/xyz",
      type: "pageview" as const,
    });
    expect(next?.url).toBe("https://www.pidge.dating/api/chats/[id]");
  });
});
