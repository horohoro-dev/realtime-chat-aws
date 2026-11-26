import { fireEvent, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../test/renderRoute.tsx";
import { server } from "../test/server.ts";

const alice = { id: 1, username: "alice" };

beforeEach(() => {
  server.use(http.get("/api/me/", () => HttpResponse.json(alice)));
});

async function submitName(name: string) {
  const input = await screen.findByRole("textbox", { name: "ルームの名前" });
  fireEvent.change(input, { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: "作成する" }));
  return input;
}

describe("ルームの作成", () => {
  it("作成に成功したら、そのルームのチャットの画面へ移る", async () => {
    const receive = vi.fn();
    const created = {
      id: 7,
      name: "読書会",
      created_by: alice,
      created_at: "2026-11-03T09:00:00Z",
    };
    server.use(
      http.post("/api/rooms/", async ({ request }) => {
        receive(await request.json());
        return HttpResponse.json(created, { status: 201 });
      }),
      http.get("/api/rooms/7/", () => HttpResponse.json(created)),
      http.get("/api/rooms/7/messages/", () => HttpResponse.json([])),
    );

    renderRoute("/rooms/new");
    await submitName("読書会");

    expect(await screen.findByRole("heading", { level: 2, name: "読書会" })).toBeInTheDocument();
    expect(receive).toHaveBeenCalledExactlyOnceWith({ name: "読書会" });
  });

  it("400 のときは、入力欄の下に name の項目の誤りを出す", async () => {
    server.use(
      http.post("/api/rooms/", () =>
        HttpResponse.json({ name: ["この名前は使えません。"] }, { status: 400 }),
      ),
    );

    renderRoute("/rooms/new");
    const input = await submitName("読書会");

    expect(await screen.findByText("この名前は使えません。")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("この名前は使えません。");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("ルームの作成");
  });

  it("長すぎる名前も切らずに送り、サーバーの誤りを入力欄の下に出す", async () => {
    const receive = vi.fn();
    const longName = "あ".repeat(51);
    server.use(
      http.post("/api/rooms/", async ({ request }) => {
        receive(await request.json());
        return HttpResponse.json(
          { name: ["この項目が50文字より長くならないようにしてください。"] },
          { status: 400 },
        );
      }),
    );

    renderRoute("/rooms/new");
    const input = await submitName(longName);

    expect(input).not.toHaveAttribute("maxlength");
    expect(
      await screen.findByText("この項目が50文字より長くならないようにしてください。"),
    ).toBeInTheDocument();
    expect(receive).toHaveBeenCalledExactlyOnceWith({ name: longName });
  });

  it("作成の途中にもう一度送っても POST は1回", async () => {
    const receive = vi.fn();
    const postResponse: { resolve: () => void } = { resolve: () => undefined };
    const postResponded = new Promise<void>((resolve) => {
      postResponse.resolve = resolve;
    });
    server.use(
      http.post("/api/rooms/", async ({ request }) => {
        receive(await request.json());
        await postResponded;
        return new HttpResponse(null, { status: 500 });
      }),
    );

    renderRoute("/rooms/new");
    const input = await submitName("読書会");
    await vi.waitFor(() => {
      expect(receive).toHaveBeenCalledOnce();
    });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    postResponse.resolve();

    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: "作成する" })).not.toHaveAttribute("aria-disabled");
    });
    expect(receive).toHaveBeenCalledExactlyOnceWith({ name: "読書会" });
  });

  it("作成の状態が画面に届く前にもう一度送っても POST は1回", async () => {
    const receive = vi.fn();
    const created = {
      id: 7,
      name: "読書会",
      created_by: alice,
      created_at: "2026-11-03T09:00:00Z",
    };
    server.use(
      http.post("/api/rooms/", async ({ request }) => {
        receive(await request.json());
        return HttpResponse.json(created, { status: 201 });
      }),
      http.get("/api/rooms/7/", () => HttpResponse.json(created)),
      http.get("/api/rooms/7/messages/", () => HttpResponse.json([])),
      http.get("/api/rooms/7/members/", () => HttpResponse.json([])),
    );

    renderRoute("/rooms/new");
    const input = await screen.findByRole("textbox", { name: "ルームの名前" });
    fireEvent.change(input, { target: { value: "読書会" } });
    const form = input.closest("form") as HTMLFormElement;
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(await screen.findByRole("heading", { level: 2, name: "読書会" })).toBeInTheDocument();
    expect(receive).toHaveBeenCalledExactlyOnceWith({ name: "読書会" });
  });

  it.each([
    ["400", () => HttpResponse.json({ name: ["この名前は使えません。"] }, { status: 400 })],
    ["500", () => new HttpResponse(null, { status: 500 })],
  ])("作成が %s で終わったあとは、もう一度送れる", async (_label, firstResponse) => {
    const receive = vi.fn();
    server.use(
      http.post("/api/rooms/", () => {
        receive();
        return firstResponse();
      }),
    );

    renderRoute("/rooms/new");
    await submitName("読書会");
    await vi.waitFor(() => {
      expect(receive).toHaveBeenCalledOnce();
    });
    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: "作成する" })).not.toHaveAttribute("aria-disabled");
    });
    await submitName("勉強会");

    await vi.waitFor(() => {
      expect(receive).toHaveBeenCalledTimes(2);
    });
  });

  it("作成の途中に名前を変えたら、送った名前への誤りは出さない", async () => {
    const receive = vi.fn();
    const postResponse: { resolve: () => void } = { resolve: () => undefined };
    const postResponded = new Promise<void>((resolve) => {
      postResponse.resolve = resolve;
    });
    server.use(
      http.post("/api/rooms/", async () => {
        receive();
        await postResponded;
        return HttpResponse.json({ name: ["この名前は使えません。"] }, { status: 400 });
      }),
    );

    renderRoute("/rooms/new");
    const input = await submitName("読書会");
    await vi.waitFor(() => {
      expect(receive).toHaveBeenCalledOnce();
    });
    fireEvent.change(input, { target: { value: "勉強会" } });
    postResponse.resolve();

    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: "作成する" })).not.toHaveAttribute("aria-disabled");
    });
    expect(screen.queryByText("この名前は使えません。")).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("400 以外の失敗なら、エラーの Alert を出す", async () => {
    server.use(http.post("/api/rooms/", () => new HttpResponse(null, { status: 500 })));

    renderRoute("/rooms/new");
    await submitName("読書会");

    expect(await screen.findByRole("alert")).toHaveTextContent("ルームを作成できませんでした");
  });

  it.each([
    ["detail", { detail: "入力が正しくありません。" }],
    ["non_field_errors", { non_field_errors: ["入力が正しくありません。"] }],
  ])("name の誤りがない 400（%s）なら、エラーの Alert を出す", async (_label, body) => {
    server.use(http.post("/api/rooms/", () => HttpResponse.json(body, { status: 400 })));

    renderRoute("/rooms/new");
    const input = await submitName("読書会");

    expect(await screen.findByRole("alert")).toHaveTextContent("ルームを作成できませんでした");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("セッションが切れて作成が 403 になったら、ログインの画面へのリンクを出す", async () => {
    const receiveMe = vi.fn();
    server.use(
      http.get("/api/me/", () => {
        receiveMe();
        return receiveMe.mock.calls.length === 1
          ? HttpResponse.json(alice)
          : new HttpResponse(null, { status: 403 });
      }),
      http.post("/api/rooms/", () => new HttpResponse(null, { status: 403 })),
    );

    renderRoute("/rooms/new");
    await submitName("読書会");

    expect(await screen.findByRole("link", { name: "ログインする" })).toHaveAttribute(
      "href",
      `/api/auth/login/?next=${encodeURIComponent("/rooms/new")}`,
    );
    expect(screen.queryByRole("textbox", { name: "ルームの名前" })).not.toBeInTheDocument();
    expect(receiveMe).toHaveBeenCalledTimes(2);
  });
});
