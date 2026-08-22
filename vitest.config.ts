import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    env: {
      DATABASE_URL: "file:./dev.db",
      STRIPE_SECRET_KEY: "sk_test_dummy_key_for_offline_tests",
      STRIPE_WEBHOOK_SECRET: "whsec_test_dummy_secret_for_offline_tests",
    },
  },
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
});
