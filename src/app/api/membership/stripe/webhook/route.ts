import { NextResponse } from "next/server";
import { applyStripeEventToMembership, verifyStripeEvent } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event;
  try {
    event = verifyStripeEvent(rawBody, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  try {
    const result = await applyStripeEventToMembership(event);
    return NextResponse.json({ received: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
