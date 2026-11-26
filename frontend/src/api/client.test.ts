import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "../test/server.ts";
import { client, createApiClient } from "./client.ts";

type EchoPaths = {
  "/api/echo/": {
    post: {
      requestBody?: never;
      responses: {
        200: { content: { "application/json": { csrfToken: string | null } } };
      };
    };
  };
};

function echoCsrfToken() {
  server.use(
    http.post("/api/echo/", ({ request }) =>
      HttpResponse.json({ csrfToken: request.headers.get("X-CSRFToken") }),
    ),
  );
}

function setCookie(value: string) {
  vi.spyOn(document, "cookie", "get").mockReturnValue(value);
}

describe("CSRF トークンのミドルウェア", () => {
  it("POST のとき、Cookie の csrftoken を X-CSRFToken ヘッダーで送る", async () => {
    setCookie("sessionid=s; csrftoken=token-123");
    echoCsrfToken();

    const { data } = await createApiClient<EchoPaths>().POST("/api/echo/");

    expect(data).toEqual({ csrfToken: "token-123" });
  });

  it("Cookie に csrftoken がなければ、POST でもヘッダーを付けない", async () => {
    setCookie("sessionid=s");
    echoCsrfToken();

    const { data } = await createApiClient<EchoPaths>().POST("/api/echo/");

    expect(data).toEqual({ csrfToken: null });
  });

  it("GET のときはヘッダーを付けない", async () => {
    setCookie("csrftoken=token-123");
    server.use(
      http.get("/api/me/", ({ request }) =>
        HttpResponse.json({ id: 1, username: request.headers.get("X-CSRFToken") ?? "なし" }),
      ),
    );

    const { data } = await client.GET("/api/me/");

    expect(data?.username).toBe("なし");
  });
});
