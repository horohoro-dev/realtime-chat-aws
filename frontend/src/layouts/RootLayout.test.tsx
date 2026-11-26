import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { renderRoute } from "../test/renderRoute.tsx";
import { server } from "../test/server.ts";

describe("ログインの確認", () => {
  it("未ログイン（403）なら、今の URL を next に付けたログインの画面へのリンクを出す", async () => {
    server.use(http.get("/api/me/", () => new HttpResponse(null, { status: 403 })));

    renderRoute("/rooms/new?from=top#form");

    const link = await screen.findByRole("link", { name: "ログインする" });
    expect(link).toHaveAttribute(
      "href",
      `/api/auth/login/?next=${encodeURIComponent("/rooms/new?from=top#form")}`,
    );
    expect(screen.getByRole("status")).toContainElement(link);
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });

  it("ログイン済み（200）なら、利用者名と画面を出す", async () => {
    server.use(
      http.get("/api/me/", () => HttpResponse.json({ id: 1, username: "alice" })),
      http.get("/api/rooms/", () => HttpResponse.json([])),
    );

    renderRoute("/rooms/new");

    expect(await screen.findByText("alice でログイン中")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("ルームを作る");
  });

  it("403 以外の失敗なら、エラーの Alert を出す", async () => {
    server.use(http.get("/api/me/", () => new HttpResponse(null, { status: 500 })));

    renderRoute("/");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "利用者の情報を取得できませんでした",
    );
  });
});
