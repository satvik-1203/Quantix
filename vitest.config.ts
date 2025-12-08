import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.config.*",
        "**/*.d.ts",
        "**/evals/**",
        "**/scripts/**",
      ],
    },
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", ".turbo"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./apps/server/src"),
      "@workspace/drizzle": path.resolve(__dirname, "./packages/drizzle/src"),
      "@workspace/common": path.resolve(__dirname, "./packages/common/src"),
    },
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
});
