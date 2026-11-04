import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: "http://localhost:4173", serviceWorkers: "block" },
  webServer: { command: "node scripts/serve.mjs 4173", url: "http://localhost:4173", reuseExistingServer: true },
  projects: [
    { name: "small-phone", use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true } },
    { name: "phone", use: { ...devices["Pixel 7"] } }
  ]
});
