import { defineConfig, devices } from "@playwright/test";
import { E2E_PUBLIC_TEST_PASSWORD, e2eUsers } from "./e2e/users.ts";

const isCi = Boolean(process.env.CI);
const port = 4173;
// make run の Django（8000番）と同時に動かせるように、別のポートにする
const apiPort = 8001;
const apiOrigin = `http://127.0.0.1:${apiPort}`;
const manage = "uv run python manage.py";

// biome-ignore lint/style/noDefaultExport: Playwright は設定ファイルの default export を読む
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: isCi
    ? [
        ["github"],
        ["html", { open: "never", outputFolder: "playwright-report" }],
        ["junit", { outputFile: "test-results/junit.xml" }],
      ]
    : [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      name: "Django",
      // prepare_e2e は E2E の DB がなければ作り、マイグレーションとテストの利用者の作成をする
      command: [
        `${manage} prepare_e2e --password ${E2E_PUBLIC_TEST_PASSWORD} ${Object.values(e2eUsers).join(" ")}`,
        `${manage} runserver ${apiPort} --noreload`,
      ].join(" && "),
      cwd: "../backend",
      env: { DJANGO_SETTINGS_MODULE: "config.settings.e2e" },
      url: `${apiOrigin}/api/auth/login/`,
      // 動いている Django を使い回すと prepare_e2e が動かず、E2E の DB と利用者がそろわない
      reuseExistingServer: false,
      stdout: "pipe",
      timeout: 120_000,
    },
    {
      name: "Vite",
      // 画面と /api を同じオリジン（localhost:4173）から配信する。/api は vite.config.ts の proxy で Django に転送する
      command: `pnpm exec vite build && pnpm exec vite preview --port ${port} --strictPort`,
      env: { API_PROXY_TARGET: apiOrigin },
      url: `http://localhost:${port}`,
      reuseExistingServer: !isCi,
      timeout: 120_000,
    },
  ],
});
