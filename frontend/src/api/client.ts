import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema.d.ts";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

function readCookie(name: string): string | undefined {
  const prefix = `${name}=`;
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return entry === undefined ? undefined : decodeURIComponent(entry.slice(prefix.length));
}

// Django の CSRF の検査は、Cookie の csrftoken と同じ値を X-CSRFToken ヘッダーで送ることを求める
export const csrfMiddleware: Middleware = {
  onRequest({ request }) {
    if (SAFE_METHODS.has(request.method)) {
      return undefined;
    }
    const token = readCookie("csrftoken");
    if (token === undefined || token === "") {
      return undefined;
    }
    request.headers.set("X-CSRFToken", token);
    return request;
  },
};

export function createApiClient<Paths extends object>() {
  const apiClient = createClient<Paths>({
    baseUrl: window.location.origin,
    // openapi-fetch は既定では createClient の時点の globalThis.fetch を持ち続ける。
    // 呼ぶたびに参照して、MSW などがあとから差し替えた fetch も使う
    fetch: (request) => globalThis.fetch(request),
  });
  apiClient.use(csrfMiddleware);
  return apiClient;
}

export const client = createApiClient<paths>();
