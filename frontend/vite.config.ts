/// <reference types="vitest/config" />
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // React Compiler がコンポーネントとフックのメモ化をビルド時に入れる（docs/development/frontend-rules.md の4章）
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  // preview.proxy の既定値は server.proxy なので、vite preview も同じように転送する
  server: {
    // dev と prd と同じく、画面と API を同じオリジンから配信してセッション Cookie と CSRF トークンを使う
    proxy: {
      "/api": {
        // 転送先の Django のオリジン。環境変数がなければ runserver の既定のポート
        target: process.env.API_PROXY_TARGET ?? "http://localhost:8000",
        // Host を画面のオリジンのままにする。Django の CSRF の検査は Origin と Host が同じかを見る
        changeOrigin: false,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // e2e/ は Playwright のテスト
    include: ["src/**/*.test.{ts,tsx}"],
    // 日時の表示はブラウザのタイムゾーンで決まるので、テストは UTC にそろえる
    env: { TZ: "UTC" },
  },
});
