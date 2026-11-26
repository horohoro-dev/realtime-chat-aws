import {
  type DefaultOptions,
  MutationCache,
  matchQuery,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { isApiError } from "./errors.ts";
import { meKeys } from "./queries/me.ts";

const MAX_QUERY_RETRIES = 3;

// 4xx はリクエストの内容や権限の問題で、やり直しても結果が変わらない
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < MAX_QUERY_RETRIES;
}

function isForbidden(error: unknown): boolean {
  return isApiError(error) && error.status === 403;
}

// DRF の SessionAuthentication は、未ログインと CSRF の失敗をどちらも 403 で返す。
// どちらかを見分けるため、403 のたびに /api/me/ を取り直す
export function createQueryClient(queryDefaults: DefaultOptions["queries"] = {}): QueryClient {
  const recheckLogin = () =>
    client.invalidateQueries({ queryKey: meKeys.all }, { cancelRefetch: false });
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (isForbidden(error) && !matchQuery({ queryKey: meKeys.all, exact: true }, query)) {
          void recheckLogin();
        }
      },
    }),
    mutationCache: new MutationCache({
      // ミューテーションの失敗の表示を、/api/me/ の取り直しの完了まで待たせない
      onError: (error) => {
        if (isForbidden(error)) {
          void recheckLogin();
        }
      },
    }),
    defaultOptions: { queries: { retry: shouldRetryQuery, ...queryDefaults } },
  });
  return client;
}

export const queryClient = createQueryClient();
