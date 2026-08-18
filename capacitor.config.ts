const config = {
  appId: "app.pidge.android",
  appName: "Pidge",
  webDir: "public",
  server: {
    url: process.env.NEXT_PUBLIC_APP_URL || "https://www.pidge.dating",
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#000000",
      launchAutoHide: true,
    },
    Geolocation: {
      permissions: ["location"],
    },
  },
};

export default config;
