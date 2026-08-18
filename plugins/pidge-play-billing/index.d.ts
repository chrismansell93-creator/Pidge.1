export type PlayPurchaseResult = {
  productId: string;
  purchaseToken: string;
  orderId?: string;
};

export interface PidgePlayBillingPlugin {
  purchase(options: { productId: string }): Promise<PlayPurchaseResult>;
}

export declare const PidgePlayBilling: PidgePlayBillingPlugin;
