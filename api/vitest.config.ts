import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: "./",
    include: ["src/modules/**/use-cases/**/*.spec.ts"],
    coverage: {
      include: ["src/modules/**/use-cases/**"],
    },
  },
});
