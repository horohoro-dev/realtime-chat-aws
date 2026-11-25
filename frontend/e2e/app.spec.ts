import { expect, test as it } from "@playwright/test";

it("トップページに見出しを表示する", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("チャット");
});
