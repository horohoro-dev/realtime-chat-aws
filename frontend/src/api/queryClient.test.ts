import type { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { createApiError } from "./errors.ts";
import { meKeys } from "./queries/me.ts";
import { memberKeys } from "./queries/members.ts";
import { messageKeys } from "./queries/messages.ts";
import { roomKeys } from "./queries/rooms.ts";
import { createQueryClient, shouldRetryQuery } from "./queryClient.ts";

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

describe("createQueryClient の 403 の扱い", () => {
  function setup() {
    const client = createQueryClient({ retry: false });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    return { client, invalidate };
  }

  async function failQuery(client: QueryClient, queryKey: readonly unknown[], error: unknown) {
    await expect(
      client.fetchQuery({
        queryKey,
        queryFn: () => Promise.reject(error),
      }),
    ).rejects.toBe(error);
  }

  it("クエリが 403 で失敗したら、meKeys のクエリを無効にする", async () => {
    const { client, invalidate } = setup();

    await failQuery(client, ["rooms", "list"], createApiError("失敗", 403));

    expect(invalidate).toHaveBeenCalledExactlyOnceWith(
      { queryKey: meKeys.all },
      { cancelRefetch: false },
    );
  });

  it("meKeys のクエリ自身が 403 で失敗したときは、無効にしない", async () => {
    const { client, invalidate } = setup();

    await failQuery(client, meKeys.all, createApiError("失敗", 403));

    expect(invalidate).not.toHaveBeenCalled();
  });

  it("403 以外の失敗では、無効にしない", async () => {
    const { client, invalidate } = setup();

    await failQuery(client, ["rooms", "list"], createApiError("失敗", 500));
    await failQuery(client, ["rooms", "detail"], new TypeError("Failed to fetch"));

    expect(invalidate).not.toHaveBeenCalled();
  });

  it("ミューテーションが 403 で失敗したら、meKeys のクエリを無効にする", async () => {
    const { client, invalidate } = setup();
    const error = createApiError("失敗", 403);

    await expect(
      client
        .getMutationCache()
        .build(client, { mutationFn: () => Promise.reject(error) })
        .execute(undefined),
    ).rejects.toBe(error);

    expect(invalidate).toHaveBeenCalledExactlyOnceWith(
      { queryKey: meKeys.all },
      { cancelRefetch: false },
    );
  });

  it("ミューテーションが 403 以外で失敗したときは、無効にしない", async () => {
    const { client, invalidate } = setup();
    const error = createApiError("失敗", 500);

    await expect(
      client
        .getMutationCache()
        .build(client, { mutationFn: () => Promise.reject(error) })
        .execute(undefined),
    ).rejects.toBe(error);

    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe("createQueryClient の 404 の扱い", () => {
  function setup() {
    const client = createQueryClient({ retry: false });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    return { client, invalidate };
  }

  async function failQuery(client: QueryClient, queryKey: readonly unknown[], error: unknown) {
    await expect(
      client.fetchQuery({
        queryKey,
        queryFn: () => Promise.reject(error),
      }),
    ).rejects.toBe(error);
  }

  async function failMutation(
    client: QueryClient,
    mutationKey: readonly unknown[] | undefined,
    error: unknown,
  ) {
    await expect(
      client
        .getMutationCache()
        .build(client, { mutationKey, mutationFn: () => Promise.reject(error) })
        .execute(undefined),
    ).rejects.toBe(error);
  }

  it.each([
    ["メッセージ", messageKeys.list(3)],
    ["メンバー", memberKeys.list(3)],
  ])("%sのクエリが 404 で失敗したら、ルームの詳細だけを無効にする", async (_name, queryKey) => {
    const { client, invalidate } = setup();

    await failQuery(client, queryKey, createApiError("失敗", 404));

    expect(invalidate).toHaveBeenCalledExactlyOnceWith(
      { queryKey: roomKeys.detail(3), exact: true },
      { cancelRefetch: false },
    );
  });

  it("ルームの下のキーを持つミューテーションが 404 で失敗したら、ルームの詳細だけを無効にする", async () => {
    const { client, invalidate } = setup();

    await failMutation(client, messageKeys.list(3), createApiError("失敗", 404));

    expect(invalidate).toHaveBeenCalledExactlyOnceWith(
      { queryKey: roomKeys.detail(3), exact: true },
      { cancelRefetch: false },
    );
  });

  it("ルームの詳細やほかのキー、キーのないミューテーションの 404 では、無効にしない", async () => {
    const { client, invalidate } = setup();
    const error = createApiError("失敗", 404);

    await failQuery(client, roomKeys.detail(3), error);
    await failQuery(client, roomKeys.list(), error);
    await failMutation(client, undefined, error);
    await failMutation(client, ["rooms", "detail", "3", "messages"], error);

    expect(invalidate).not.toHaveBeenCalled();
  });

  it("ルームの下のキーでも、404 以外の失敗では無効にしない", async () => {
    const { client, invalidate } = setup();

    await failQuery(client, messageKeys.list(3), createApiError("失敗", 500));
    await failMutation(client, memberKeys.list(3), createApiError("失敗", 400));

    expect(invalidate).not.toHaveBeenCalled();
  });
});
