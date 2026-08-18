package app.pidge.billing;

import androidx.annotation.NonNull;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.QueryProductDetailsParams;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "PidgePlayBilling")
public class PidgePlayBillingPlugin extends Plugin {
    private BillingClient billingClient;
    private PluginCall pendingCall;
    private String pendingProductId;

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
            .enablePendingPurchases()
            .setListener(this::onPurchasesUpdated)
            .build();
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        if (productId == null || productId.isEmpty()) {
            call.reject("Missing productId");
            return;
        }
        pendingCall = call;
        pendingProductId = productId;
        ensureReady(() -> queryAndLaunch(productId, call));
    }

    private void ensureReady(Runnable next) {
        if (billingClient.isReady()) {
            next.run();
            return;
        }
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    next.run();
                } else if (pendingCall != null) {
                    pendingCall.reject("Play Billing unavailable: " + result.getDebugMessage());
                    pendingCall = null;
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                // Reconnect on the next purchase attempt.
            }
        });
    }

    private void queryAndLaunch(String productId, PluginCall call) {
        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        products.add(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        );
        billingClient.queryProductDetailsAsync(
            QueryProductDetailsParams.newBuilder().setProductList(products).build(),
            (result, details) -> {
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || details.isEmpty()) {
                    call.reject("Subscription " + productId + " was not found in Play Console.");
                    pendingCall = null;
                    return;
                }
                ProductDetails product = details.get(0);
                List<ProductDetails.SubscriptionOfferDetails> offers = product.getSubscriptionOfferDetails();
                if (offers == null || offers.isEmpty()) {
                    call.reject("No Play offer is configured for " + productId);
                    pendingCall = null;
                    return;
                }
                BillingFlowParams.ProductDetailsParams sku =
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(product)
                        .setOfferToken(offers.get(0).getOfferToken())
                        .build();
                List<BillingFlowParams.ProductDetailsParams> skuList = new ArrayList<>();
                skuList.add(sku);
                BillingResult launch = billingClient.launchBillingFlow(
                    getActivity(),
                    BillingFlowParams.newBuilder().setProductDetailsParamsList(skuList).build()
                );
                if (launch.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    call.reject(launch.getDebugMessage());
                    pendingCall = null;
                }
            }
        );
    }

    private void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        PluginCall call = pendingCall;
        if (call == null) return;
        if (result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            call.reject("Purchase cancelled");
            pendingCall = null;
            return;
        }
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || purchases == null || purchases.isEmpty()) {
            call.reject(result.getDebugMessage() == null ? "Purchase failed" : result.getDebugMessage());
            pendingCall = null;
            return;
        }
        Purchase purchase = purchases.get(0);
        if (!purchase.isAcknowledged()) {
            billingClient.acknowledgePurchase(
                AcknowledgePurchaseParams.newBuilder().setPurchaseToken(purchase.getPurchaseToken()).build(),
                ignored -> {}
            );
        }
        JSObject data = new JSObject();
        data.put("productId", pendingProductId);
        data.put("purchaseToken", purchase.getPurchaseToken());
        if (purchase.getOrderId() != null) {
            data.put("orderId", purchase.getOrderId());
        }
        call.resolve(data);
        pendingCall = null;
    }
}
