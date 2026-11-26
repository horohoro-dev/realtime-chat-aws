import { describe, expect, it } from "vitest";
import { createApiError } from "./errors.ts";
import { shouldRetryQuery } from "./queryClient.ts";

describe("shouldRetryQuery", () => {
  it.each([400, 403, 404, 499])("%i の ApiError ではやり直さない", (status) => {
    expect(shouldRetryQuery(0, createApiError("失敗", status))).toBe(false);
  });

  it.each([500, 503])("%i の ApiError は 3 回までやり直す", (status) => {
    const error = createApiError("失敗", status);
    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldRetryQuery(2, error)).toBe(true);
    expect(shouldRetryQuery(3, error)).toBe(false);
  });

  it("ネットワークの失敗は 3 回までやり直す", () => {
    const error = new TypeError("Failed to fetch");
    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldRetryQuery(2, error)).toBe(true);
    expect(shouldRetryQuery(3, error)).toBe(false);
  });
});
