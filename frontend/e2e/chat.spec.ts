import { type Browser, expect, test as it, type Locator, type Page } from "@playwright/test";
import { E2E_PUBLIC_TEST_PASSWORD, e2eUsers } from "./users.ts";

// チャットの画面はメッセージを3秒ごとに取り直す。expect の既定の5秒では足りないことがある
const pollingTimeout = 15_000;

async function fillIn(field: Locator, value: string) {
  // biome-ignore lint/plugin: Playwright の Locator.fill は入力欄に文字を入れるメソッドで、配列を書き換えない
  await field.fill(value);
}

async function openLoggedInPage(browser: Browser, username: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/");
  await page.getByRole("link", { name: "ログインする" }).click();
  // ログインの画面は DRF の rest_framework/login.html
  await fillIn(page.getByLabel("ユーザー名"), username);
  await fillIn(page.getByLabel("パスワード"), E2E_PUBLIC_TEST_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText(`${username} でログイン中`)).toBeVisible();
  return page;
}

async function sendMessage(page: Page, body: string) {
  await fillIn(page.getByRole("textbox", { name: "メッセージ" }), body);
  await page.getByRole("button", { name: "送信する" }).click();
}

it("2人の利用者が同じルームでメッセージを送り合える", async ({ browser }) => {
  const suffix = `${Date.now()}`;
  const roomName = `E2E のルーム ${suffix}`;
  const aliceMessage = `alice から bob へ ${suffix}`;
  const bobMessage = `bob から alice へ ${suffix}`;

  const alice = await openLoggedInPage(browser, e2eUsers.alice);
  const bob = await openLoggedInPage(browser, e2eUsers.bob);

  await alice.goto("/rooms/new");
  await fillIn(alice.getByRole("textbox", { name: "ルームの名前" }), roomName);
  await alice.getByRole("button", { name: "作成する" }).click();
  await expect(alice).toHaveURL(/\/rooms\/\d+$/);
  await expect(alice.getByRole("heading", { name: roomName })).toBeVisible();

  await fillIn(alice.getByRole("textbox", { name: "招待する利用者名" }), e2eUsers.bob);
  await alice.getByRole("button", { name: "招待する" }).click();
  await expect(alice.getByRole("list", { name: "メンバー" })).toContainText(e2eUsers.bob);

  await bob.goto("/");
  await bob.getByRole("link", { name: roomName }).click();
  await expect(bob.getByRole("heading", { name: roomName })).toBeVisible();

  await sendMessage(alice, aliceMessage);
  await expect(bob.getByRole("list", { name: "メッセージ" })).toContainText(aliceMessage, {
    timeout: pollingTimeout,
  });

  await sendMessage(bob, bobMessage);
  await expect(alice.getByRole("list", { name: "メッセージ" })).toContainText(bobMessage, {
    timeout: pollingTimeout,
  });

  await alice.context().close();
  await bob.context().close();
});
