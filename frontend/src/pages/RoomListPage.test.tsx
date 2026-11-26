import { fireEvent, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../test/renderRoute.tsx";
import { server } from "../test/server.ts";

const alice = { id: 1, username: "alice" };

beforeEach(() => {
  server.use(http.get("/api/me/", () => HttpResponse.json(alice)));
});

describe("ルームの一覧", () => {
  it("ルームの名前と、各ルームのチャットの画面へのリンクを出す", async () => {
    server.use(
      http.get("/api/rooms/", () =>
        HttpResponse.json([
          { id: 3, name: "雑談", created_by: alice, created_at: "2026-11-02T09:00:00Z" },
          { id: 2, name: "開発の相談", created_by: alice, created_at: "2026-11-01T09:00:00Z" },
        ]),
      ),
    );

    renderRoute("/");

    expect(await screen.findByRole("link", { name: "雑談" })).toHaveAttribute("href", "/rooms/3");
    expect(screen.getByRole("link", { name: "開発の相談" })).toHaveAttribute("href", "/rooms/2");
    expect(screen.getByRole("link", { name: "ルームを作る" })).toHaveAttribute(
      "href",
      "/rooms/new",
    );
  });

  it("ルームのリンクを押すと、React Router の遷移でチャットの画面へ移る", async () => {
    const receiveMe = vi.fn();
    server.use(
      http.get("/api/me/", () => {
        receiveMe();
        return HttpResponse.json(alice);
      }),
      http.get("/api/rooms/", () =>
        HttpResponse.json([
          { id: 3, name: "雑談", created_by: alice, created_at: "2026-11-02T09:00:00Z" },
        ]),
      ),
    );

    renderRoute("/");
    const loggedIn = await screen.findByText("alice でログイン中");
    fireEvent.click(await screen.findByRole("link", { name: "雑談" }));

    expect(await screen.findByRole("heading", { level: 2, name: "ルーム 3" })).toBeInTheDocument();
    expect(screen.getByText("alice でログイン中")).toBe(loggedIn);
    expect(receiveMe).toHaveBeenCalledOnce();
  });

  it("「ルームを作る」を押すと、React Router の遷移で作成の画面へ移る", async () => {
    server.use(http.get("/api/rooms/", () => HttpResponse.json([])));

    renderRoute("/");
    fireEvent.click(await screen.findByRole("link", { name: "ルームを作る" }));

    expect(
      await screen.findByRole("heading", { level: 2, name: "ルームの作成" }),
    ).toBeInTheDocument();
  });

  it("ルームがないときは、その旨と作成の画面へのリンクを出す", async () => {
    server.use(http.get("/api/rooms/", () => HttpResponse.json([])));

    renderRoute("/");

    expect(await screen.findByText("参加しているルームはまだありません。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ルームを作る" })).toHaveAttribute(
      "href",
      "/rooms/new",
    );
  });

  it("取得に失敗したら、エラーの Alert を出す", async () => {
    server.use(http.get("/api/rooms/", () => new HttpResponse(null, { status: 500 })));

    renderRoute("/");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ルームの一覧を取得できませんでした",
    );
  });

  it("500 のときは、最初の 1 回のあと 3 回やり直してから Alert を出す", async () => {
    const receiveRooms = vi.fn();
    server.use(
      http.get("/api/rooms/", () => {
        receiveRooms();
        return new HttpResponse(null, { status: 500 });
      }),
    );

    renderRoute("/");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ルームの一覧を取得できませんでした",
    );
    expect(receiveRooms).toHaveBeenCalledTimes(4);
  });

  it("403 のときは、やり直さずに Alert を出す", async () => {
    const receiveRooms = vi.fn();
    server.use(
      http.get("/api/rooms/", () => {
        receiveRooms();
        return new HttpResponse(null, { status: 403 });
      }),
    );

    renderRoute("/");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ルームの一覧を取得できませんでした",
    );
    expect(receiveRooms).toHaveBeenCalledOnce();
  });

  it("画面を開いたあとにセッションが切れたら、ログインの画面へのリンクを出す", async () => {
    const receiveMe = vi.fn();
    server.use(
      http.get("/api/me/", () => {
        receiveMe();
        return receiveMe.mock.calls.length === 1
          ? HttpResponse.json(alice)
          : new HttpResponse(null, { status: 403 });
      }),
      http.get("/api/rooms/", () => new HttpResponse(null, { status: 403 })),
    );

    renderRoute("/");

    expect(await screen.findByRole("link", { name: "ログインする" })).toHaveAttribute(
      "href",
      `/api/auth/login/?next=${encodeURIComponent("/")}`,
    );
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    expect(receiveMe).toHaveBeenCalledTimes(2);
  });

  it("403 のあとのログインの確認が失敗しても、前に取れた利用者のまま画面を出す", async () => {
    const receiveMe = vi.fn();
    server.use(
      http.get("/api/me/", () => {
        receiveMe();
        return receiveMe.mock.calls.length === 1
          ? HttpResponse.json(alice)
          : new HttpResponse(null, { status: 500 });
      }),
      http.get("/api/rooms/", () => new HttpResponse(null, { status: 403 })),
    );

    renderRoute("/");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ルームの一覧を取得できませんでした",
    );
    await vi.waitFor(() => {
      expect(receiveMe).toHaveBeenCalledTimes(5);
    });
    expect(screen.getByText("alice でログイン中")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("ルームの一覧");
  });
});
