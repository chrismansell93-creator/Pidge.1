"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { telemetryBeforeSend } from "@/lib/telemetry";

export function SiteTelemetry() {
  return (
    <>
      <Analytics beforeSend={telemetryBeforeSend} />
      <SpeedInsights beforeSend={telemetryBeforeSend} />
    </>
  );
}
