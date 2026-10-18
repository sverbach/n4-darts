import react from "@vitejs/plugin-react";
import { defaultClientConditions, defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Bundle workspace packages from their TypeScript sources (see vitest.config.ts).
  resolve: { conditions: ["source", ...defaultClientConditions] },
  server: {
    proxy: { "/api": "http://localhost:3000" },
  },
});
