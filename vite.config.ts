import { defineConfig } from "vitest/config";
import { normalizePath } from "vite";
import { fileURLToPath } from "node:url";

function fromRoot(relativePath: string) {
  return normalizePath(fileURLToPath(new URL(relativePath, import.meta.url)));
}

export default defineConfig({
  mode: "development",
  resolve: {
    alias: {
      "@src": fromRoot("./src/src"),
    },
  },
  test: {
    globals: true,
    include: ["./__test__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    environment: "happy-dom",
  }
});
