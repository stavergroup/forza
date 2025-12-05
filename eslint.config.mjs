import { defineConfig } from "eslint/config";

/**
 * Flat ESLint config for Next.js 15 that works on Vercel.
 */
export default defineConfig([
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
    ],
  },
]);
