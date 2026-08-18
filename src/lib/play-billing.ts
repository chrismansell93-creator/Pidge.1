import { registerPlugin } from "@capacitor/core";
import { PLAY_PRODUCT_ID, isNativeAndroid } from "@/lib/platform";

export type PlayPurchase = {
  productId: string;
  purchaseToken: string;
  orderId?: string;
};

const NativePlayBilling = registerPlugin<{
  purchase: (options: { productId: string }) => Promise<PlayPurchase>;
}>("PidgePlayBilling");

function injectedBridge(): { purchase: (productId: string) => Promise<PlayPurchase> } | null {
  return (
    window as Window & {
      PidgePlayBilling?: { purchase: (productId: string) => Promise<PlayPurchase> };
    }
  ).PidgePlayBilling ?? null;
}

export function canUsePlayBilling(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(injectedBridge() || isNativeAndroid());
}

export async function purchaseUnlimited(): Promise<PlayPurchase> {
  const bridge = injectedBridge();
  if (bridge) return bridge.purchase(PLAY_PRODUCT_ID);

  if (isNativeAndroid()) {
    return NativePlayBilling.purchase({ productId: PLAY_PRODUCT_ID });
  }

  throw new Error(
    "Open Pidge from the Google Play app to pay. Unlimited is billed only through Google Play.",
  );
}
