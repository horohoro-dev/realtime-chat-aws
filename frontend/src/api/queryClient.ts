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

// API はセッションが切れると 403 を返す。/api/me/ を取り直し、それも 403 なら RootLayout がログインの案内を出す
export function createQueryClient(queryDefaults: DefaultOptions["queries"] = {}): QueryClient {
  const recheckLogin = () => client.invalidateQueries({ queryKey: meKeys.all });
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: async (error, query) => {
        if (isForbidden(error) && !matchQuery({ queryKey: meKeys.all }, query)) {
          await recheckLogin();
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: async (error) => {
        if (isForbidden(error)) {
          await recheckLogin();
        }
      },
    }),
    defaultOptions: { queries: { retry: shouldRetryQuery, ...queryDefaults } },
  });
  return client;
}

export const queryClient = createQueryClient();
