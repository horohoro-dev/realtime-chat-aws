import {
  type DefaultOptions,
  MutationCache,
  matchQuery,
  QueryCache,
  QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { isApiError } from "./errors.ts";
import { meKeys } from "./queries/me.ts";
import { roomKeys } from "./queries/rooms.ts";

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

function isNotFound(error: unknown): boolean {
  return isApiError(error) && error.status === 404;
}

// roomKeys.detail(roomId) の下のキー（メッセージ、メンバーなど）なら、そのルームの詳細のキーを返す。
// 詳細のキーそのものと、ほかのキーには undefined を返す
function parentRoomDetailKey(key: QueryKey | undefined) {
  if (key === undefined || key.length <= roomKeys.detail(0).length) {
    return undefined;
  }
  const [scope, kind, roomId] = key;
  return scope === roomKeys.all[0] && kind === "detail" && typeof roomId === "number"
    ? roomKeys.detail(roomId)
    : undefined;
}

// DRF の SessionAuthentication は、未ログインと CSRF の失敗をどちらも 403 で返す。
// どちらかを見分けるため、403 のたびに /api/me/ を取り直す。
// ルームの下の API は、ルームがないときと自分がメンバーでないときに 404 を返す。
// 404 なら、ルームの詳細を取り直して、ルームがまだあるかを確かめる
export function createQueryClient(queryDefaults: DefaultOptions["queries"] = {}): QueryClient {
  const recheckLogin = () =>
    client.invalidateQueries({ queryKey: meKeys.all }, { cancelRefetch: false });
  // 詳細のキーはメッセージとメンバーのキーの接頭辞なので、exact で詳細だけを取り直す
  const recheckRoom = (key: QueryKey | undefined) => {
    const detailKey = parentRoomDetailKey(key);
    return detailKey === undefined
      ? Promise.resolve()
      : client.invalidateQueries({ queryKey: detailKey, exact: true }, { cancelRefetch: false });
  };
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (isForbidden(error) && !matchQuery({ queryKey: meKeys.all, exact: true }, query)) {
          void recheckLogin();
        }
        if (isNotFound(error)) {
          void recheckRoom(query.queryKey);
        }
      },
    }),
    mutationCache: new MutationCache({
      // ミューテーションの失敗の表示を、/api/me/ やルームの詳細の取り直しの完了まで待たせない
      onError: (error, _variables, _onMutateResult, mutation) => {
        if (isForbidden(error)) {
          void recheckLogin();
        }
        if (isNotFound(error)) {
          void recheckRoom(mutation.options.mutationKey);
        }
      },
    }),
    defaultOptions: { queries: { retry: shouldRetryQuery, ...queryDefaults } },
  });
  return client;
}

export const queryClient = createQueryClient();
