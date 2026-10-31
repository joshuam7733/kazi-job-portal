import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a running app with freshly seeded data:
 *   npm run db:seed && npm run build && npm start   (or npm run dev)
 *   npm run test:e2e
 * Set E2E_BASE_URL to test another environment. Tests create data, so re-seed before each full run.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    navigationTimeout: 60_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
});
