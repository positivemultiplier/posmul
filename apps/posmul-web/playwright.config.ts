import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  reporter: [["list"], ["html", { outputFolder: "playwright-report" }]],
  webServer: {
    command: "pnpm --filter apps/posmul-web dev",
    port: 3000,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
