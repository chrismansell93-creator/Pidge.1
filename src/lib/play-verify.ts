import { PLAY_PRODUCT_ID } from "@/lib/platform";

export type PlayPurchaseInput = {
  productId: string;
  purchaseToken: string;
  orderId?: string;
};

/**
 * Verify a Google Play subscription purchase.
 *
 * Production requires GOOGLE_PLAY_PACKAGE_NAME and GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
 * (the full service-account JSON as a single env string). Without those, grants
 * are refused so Unlimited cannot be forged via a raw POST.
 *
 * Local/dev may set PLAY_BILLING_DEV_BYPASS=1 to accept well-formed tokens for
 * emulator testing only.
 */
export async function verifyPlayPurchase(
  input: PlayPurchaseInput,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (input.productId !== PLAY_PRODUCT_ID) {
    return { ok: false, status: 400, error: "Unknown Play product" };
  }

  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim() || "com.pidge.myapp";
  const rawAccount = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim();
  const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  const allowDevBypass =
    !isProd && process.env.PLAY_BILLING_DEV_BYPASS === "1";

  if (!rawAccount) {
    if (allowDevBypass) return { ok: true };
    return {
      ok: false,
      status: 503,
      error: "Play billing verification is not configured",
    };
  }

  let credentials: {
    client_email?: string;
    private_key?: string;
    token_uri?: string;
  };
  try {
    credentials = JSON.parse(rawAccount) as typeof credentials;
  } catch {
    return { ok: false, status: 503, error: "Play billing credentials are invalid" };
  }

  if (!credentials.client_email || !credentials.private_key) {
    return { ok: false, status: 503, error: "Play billing credentials are incomplete" };
  }

  try {
    const accessToken = await googleAccessToken(credentials);
    const url =
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/` +
      `${encodeURIComponent(packageName)}/purchases/subscriptions/` +
      `${encodeURIComponent(input.productId)}/tokens/${encodeURIComponent(input.purchaseToken)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        ok: false,
        status: 402,
        error: detail ? `Play purchase rejected (${res.status})` : "Play purchase rejected",
      };
    }

    const payload = (await res.json()) as {
      paymentState?: number;
      expiryTimeMillis?: string;
      cancelReason?: number;
    };

    // paymentState 1 = received; 2 = free trial; 0 = pending
    if (payload.paymentState !== 1 && payload.paymentState !== 2) {
      return { ok: false, status: 402, error: "Play purchase is not active" };
    }

    if (payload.expiryTimeMillis) {
      const expiry = Number(payload.expiryTimeMillis);
      if (Number.isFinite(expiry) && expiry < Date.now()) {
        return { ok: false, status: 402, error: "Play subscription expired" };
      }
    }

    return { ok: true };
  } catch {
    return { ok: false, status: 502, error: "Could not reach Google Play" };
  }
}

async function googleAccessToken(credentials: {
  client_email?: string;
  private_key?: string;
  token_uri?: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: credentials.token_uri || "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  const unsigned = `${encode(header)}.${encode(claim)}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(credentials.private_key!),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${Buffer.from(signature).toString("base64url")}`;

  const tokenRes = await fetch(credentials.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error("token exchange failed");
  }

  const json = (await tokenRes.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("missing access_token");
  return json.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const binary = Buffer.from(cleaned, "base64");
  return binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength);
}
