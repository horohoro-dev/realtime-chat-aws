import { fireEvent, screen, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../test/renderRoute.tsx";
import { server } from "../test/server.ts";

const alice = { id: 1, username: "alice" };
const bob = { id: 2, username: "bob" };
const room = { id: 3, name: "雑談", created_by: alice, created_at: "2026-11-02T09:00:00Z" };
const firstMessage = {
  id: 10,
  sender: alice,
  body: "おはようございます",
  created_at: "2026-11-03T09:00:00Z",
};
const secondMessage = {
  id: 11,
  sender: bob,
  body: "今日もよろしく",
  created_at: "2026-11-03T09:05:00Z",
};

beforeEach(() => {
  server.use(
    http.get("/api/me/", () => HttpResponse.json(alice)),
    http.get("/api/rooms/3/", () => HttpResponse.json(room)),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

async function submitBody(body: string) {
  const input = await screen.findByRole("textbox", { name: "メッセージ" });
  fireEvent.change(input, { target: { value: body } });
  fireEvent.click(screen.getByRole("button", { name: "送信する" }));
  return input;
}

describe("チャット", () => {
  it("ルームの名前と、メッセージの送った人、本文、日時を出す", async () => {
    server.use(
      http.get("/api/rooms/3/messages/", () => HttpResponse.json([firstMessage, secondMessage])),
    );

    renderRoute("/rooms/3");

    expect(await screen.findByRole("heading", { level: 2, name: "雑談" })).toBeInTheDocument();
    const items = within(await screen.findByRole("list", { name: "メッセージ" })).getAllByRole(
      "listitem",
    );
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("alice");
    expect(items[0]).toHaveTextContent("おはようございます");
    expect(items[1]).toHaveTextContent("bob");
    expect(items[1]).toHaveTextContent("今日もよろしく");
    const time = items[0]?.querySelector("time");
    expect(time).toHaveAttribute("dateTime", "2026-11-03T09:00:00Z");
    expect(time).toHaveTextContent("2026/11/03");
  });

  it("メッセージがないときは、その旨を出す", async () => {
    server.use(http.get("/api/rooms/3/messages/", () => HttpResponse.json([])));

    renderRoute("/rooms/3");

    expect(await screen.findByText("メッセージはまだありません。")).toBeInTheDocument();
  });

  it("メッセージの一覧を3秒ごとに取り直す", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    const receiveGet = vi.fn();
    server.use(
      http.get("/api/rooms/3/messages/", () => {
        receiveGet();
        return HttpResponse.json([firstMessage]);
      }),
    );

    renderRoute("/rooms/3");
    await screen.findByText("おはようございます");
    expect(receiveGet).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(2999);
    expect(receiveGet).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1);
    await vi.waitFor(() => {
      expect(receiveGet).toHaveBeenCalledTimes(2);
    });
  });

  it("送信すると POST を呼び、一覧を取り直して、入力欄を空にする", async () => {
    const receivePost = vi.fn();
    const receiveGet = vi.fn();
    const stored = [firstMessage];
    const posted = { ...secondMessage, sender: alice };
    server.use(
      http.get("/api/rooms/3/messages/", () => {
        receiveGet();
        return HttpResponse.json(receivePost.mock.calls.length > 0 ? [...stored, posted] : stored);
      }),
      http.post("/api/rooms/3/messages/", async ({ request }) => {
        receivePost(await request.json());
        return HttpResponse.json(posted, { status: 201 });
      }),
    );

    renderRoute("/rooms/3");
    await screen.findByText("おはようございます");
    const input = await submitBody("今日もよろしく");

    expect(await screen.findByText("今日もよろしく")).toBeInTheDocument();
    expect(receivePost).toHaveBeenCalledExactlyOnceWith({ body: "今日もよろしく" });
    expect(receiveGet).toHaveBeenCalledTimes(2);
    expect(input).toHaveValue("");
  });

  it("400 のときは、入力欄の下に body の項目の誤りを出し、入力を残す", async () => {
    server.use(
      http.get("/api/rooms/3/messages/", () => HttpResponse.json([])),
      http.post("/api/rooms/3/messages/", () =>
        HttpResponse.json(
          { body: ["この項目が2000文字より長くならないようにしてください。"] },
          { status: 400 },
        ),
      ),
    );

    renderRoute("/rooms/3");
    const longBody = "あ".repeat(2001);
    const input = await submitBody(longBody);

    expect(
      await screen.findByText("この項目が2000文字より長くならないようにしてください。"),
    ).toBeInTheDocument();
    expect(input).not.toHaveAttribute("maxlength");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "この項目が2000文字より長くならないようにしてください。",
    );
    expect(input).toHaveValue(longBody);
  });

  it("400 以外の送信の失敗なら、エラーの Alert を出す", async () => {
    server.use(
      http.get("/api/rooms/3/messages/", () => HttpResponse.json([])),
      http.post("/api/rooms/3/messages/", () => new HttpResponse(null, { status: 500 })),
    );

    renderRoute("/rooms/3");
    const input = await submitBody("こんにちは");

    expect(await screen.findByRole("alert")).toHaveTextContent("メッセージを送信できませんでした");
    expect(input).toHaveValue("こんにちは");
  });

  it("404 のときは「ルームが見つかりません」と一覧へのリンクを出す", async () => {
    server.use(
      http.get("/api/rooms/3/", () => HttpResponse.json({ detail: "Not found." }, { status: 404 })),
    );

    renderRoute("/rooms/3");

    expect(
      await screen.findByRole("heading", { level: 2, name: "ルームが見つかりません" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ルームの一覧へ戻る" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("textbox", { name: "メッセージ" })).not.toBeInTheDocument();
  });

  it("ルームの ID が正の整数でないときは、取得せずに「ルームが見つかりません」を出す", async () => {
    renderRoute("/rooms/abc");

    expect(
      await screen.findByRole("heading", { level: 2, name: "ルームが見つかりません" }),
    ).toBeInTheDocument();
  });

  it("ルームの取得に 404 以外で失敗したら、エラーの Alert を出す", async () => {
    server.use(http.get("/api/rooms/3/", () => new HttpResponse(null, { status: 500 })));

    renderRoute("/rooms/3");

    expect(await screen.findByRole("alert")).toHaveTextContent("ルームを取得できませんでした");
  });

  it("メッセージの取得に失敗したら、エラーの Alert を出す", async () => {
    server.use(http.get("/api/rooms/3/messages/", () => new HttpResponse(null, { status: 500 })));

    renderRoute("/rooms/3");

    expect(await screen.findByRole("alert")).toHaveTextContent("メッセージを取得できませんでした");
  });
});
