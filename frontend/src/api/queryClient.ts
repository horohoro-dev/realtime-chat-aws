import { QueryClient, type QueryClientConfig } from "@tanstack/react-query";
import { isApiError } from "./errors.ts";

const MAX_QUERY_RETRIES = 3;

// 4xx はリクエストの内容や権限の問題で、やり直しても結果が変わらない。
// ネットワークの失敗と 5xx は、最大 3 回までやり直す
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < MAX_QUERY_RETRIES;
}

export const queryClientConfig: QueryClientConfig = {
  defaultOptions: { queries: { retry: shouldRetryQuery } },
};

export const queryClient = new QueryClient(queryClientConfig);
