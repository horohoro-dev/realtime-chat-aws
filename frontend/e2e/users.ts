// E2E テストの DB にだけ作る利用者。パスワードは公開してよいテスト用の固定の値
export const E2E_PUBLIC_TEST_PASSWORD = "e2e-public-test-password";

export const e2eUsers = {
  alice: "e2e-alice",
  bob: "e2e-bob",
} as const;
