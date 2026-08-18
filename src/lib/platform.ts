export function isNativeAndroid(): boolean {
  if (typeof window === "undefined") return false;
  const capacitor = (window as Window & { Capacitor?: { getPlatform?: () => string; isNativePlatform?: () => boolean } }).Capacitor;
  if (capacitor?.getPlatform?.() === "android") return true;
  return Boolean(capacitor?.isNativePlatform?.() && /android/i.test(navigator.userAgent));
}

export const PLAY_PRODUCT_ID = "pidge_unlimited_monthly";
