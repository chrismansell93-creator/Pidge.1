const { registerPlugin } = require("@capacitor/core");

const PidgePlayBilling = registerPlugin("PidgePlayBilling", {
  web: {
    purchase() {
      return Promise.reject(
        new Error("Unlimited is billed only through Google Play on Android."),
      );
    },
  },
});

module.exports = { PidgePlayBilling };
