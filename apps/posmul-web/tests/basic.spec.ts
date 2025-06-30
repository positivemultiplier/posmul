import { expect, test } from "@playwright/test";

test.describe("Home page", () => {
  test("should load and display title", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await expect(page).toHaveTitle(/PosMul/);
  });
});
