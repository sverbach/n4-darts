import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defaultClientConditions, defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Bundle workspace packages from their TypeScript sources (see vitest.config.ts).
  resolve: { conditions: ["source", ...defaultClientConditions] },
  server: {
    // Same PORT as the server, so `PORT=3100 pnpm dev` works when 3000 is taken.
    proxy: { "/api": `http://localhost:${process.env.PORT ?? 3000}` },
  },
});
