import { defineConfig } from "vitest/config";

// Workspace packages expose their TypeScript sources under the "source" export
// condition, so tests run against sources and never need a prior build.
// Setting conditions replaces Vite's defaults, hence they're repeated here.
const conditions = ["source", "module", "development|production"];

export default defineConfig({
  resolve: { conditions: [...conditions, "browser"] },
  ssr: { resolve: { conditions: [...conditions, "node"] } },
  test: {
    passWithNoTests: true,
    projects: [
      { extends: true, test: { name: "engine", root: "packages/engine" } },
      { extends: true, test: { name: "server", root: "packages/server", environment: "node" } },
      { extends: true, test: { name: "web", root: "packages/web" } },
      { extends: true, test: { name: "board-sim", root: "tools/board-sim", environment: "node" } },
    ],
  },
});
