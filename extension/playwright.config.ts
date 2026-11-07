import { defineConfig } from "@playwright/test"

// E2E tests load the production build from build/chrome-mv3-prod.
// Run via `pnpm test:e2e`, which builds first.
export default defineConfig({
  testDir: "./e2e",
  // *.e2e.ts so vitest's default *.test.ts / *.spec.ts glob ignores them
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    trace: "retain-on-failure"
  }
})
