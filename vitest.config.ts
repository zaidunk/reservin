import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "tests/integration/**"],
    setupFiles: ["./src/tests/setup.ts"],
  },
});
