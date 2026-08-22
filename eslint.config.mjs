import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  // Capacitor plugin shim: CommonJS by contract (Capacitor's native bridge
  // loads it via require), not part of the Next.js app bundle.
  { ignores: ["plugins/**"] },
  ...nextVitals,
  ...nextTs,
];

export default eslintConfig;
