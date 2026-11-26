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

const carol = { id: 4, username: "carol" };
const aliceMember = { user: alice, joined_at: "2026-11-02T09:00:00Z" };
const bobMember = { user: bob, joined_at: "2026-11-02T10:00:00Z" };
const carolMember = { user: carol, joined_at: "2026-11-04T09:00:00Z" };

beforeEach(() => {
  server.use(
    http.get("/api/me/", () => HttpResponse.json(alice)),
    http.get("/api/rooms/3/", () => HttpResponse.json(room)),
    http.get("/api/rooms/3/members/", () => HttpResponse.json([aliceMember])),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

// 最初の取得だけ 200 で、そのあとは 404 を返す。画面を開いたあとにルームがなくなった場合
function serveRoomRemovedAfterFirstGet() {
  const receiveGet = vi.fn();
  server.use(
    http.get("/api/rooms/3/", () => {
      receiveGet();
      return receiveGet.mock.calls.length === 1
        ? HttpResponse.json(room)
        : HttpResponse.json({ detail: "Not found." }, { status: 404 });
    }),
  );
  return receiveGet;
}

const notFound = () => HttpResponse.json({ detail: "Not found." }, { status: 404 });

async function expectRoomNotFound() {
  expect(
    await screen.findByRole("heading", { level: 2, name: "ルームが見つかりません" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "ルームの一覧へ戻る" })).toHaveAttribute("href", "/");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
}

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
    expect(receiveGet.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(input).toHaveValue("");
  });

  it("送信の途中にもう一度送っても POST は1回で、途中で打った次の本文は残す", async () => {
    const receivePost = vi.fn();
    const postResponse: { resolve: () => void } = { resolve: () => undefined };
    const postResponded = new Promise<void>((resolve) => {
      postResponse.resolve = resolve;
    });
    server.use(
      http.get("/api/rooms/3/messages/", () => HttpResponse.json([firstMessage])),
      http.post("/api/rooms/3/messages/", async ({ request }) => {
        receivePost(await request.json());
        await postResponded;
        return HttpResponse.json({ ...secondMessage, sender: alice }, { status: 201 });
      }),
    );

    renderRoute("/rooms/3");
    await screen.findByText("おはようございます");
    const input = await submitBody("今日もよろしく");
    await vi.waitFor(() => {
      expect(receivePost).toHaveBeenCalledOnce();
    });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    fireEvent.change(input, { target: { value: "次の本文" } });
    postResponse.resolve();

    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: "送信する" })).not.toHaveAttribute("aria-disabled");
    });
    expect(receivePost).toHaveBeenCalledExactlyOnceWith({ body: "今日もよろしく" });
    expect(input).toHaveValue("次の本文");
  });

  it("送信の途中に打ち直した本文は、送った本文と同じでも残す", async () => {
    const postResponse: { resolve: () => void } = { resolve: () => undefined };
    const postResponded = new Promise<void>((resolve) => {
      postResponse.resolve = resolve;
    });
    const receivePost = vi.fn();
    server.use(
      http.get("/api/rooms/3/messages/", () => HttpResponse.json([firstMessage])),
      http.post("/api/rooms/3/messages/", async () => {
        receivePost();
        await postResponded;
        return HttpResponse.json(
          { ...secondMessage, body: "了解", sender: alice },
          { status: 201 },
        );
      }),
    );

    renderRoute("/rooms/3");
    await screen.findByText("おはようございます");
    const input = await submitBody("了解");
    await vi.waitFor(() => {
      expect(receivePost).toHaveBeenCalledOnce();
    });
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.change(input, { target: { value: "了解" } });
    postResponse.resolve();

    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: "送信する" })).not.toHaveAttribute("aria-disabled");
    });
    expect(input).toHaveValue("了解");
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

  it("送信が 404 で、ルームも 404 になったら、「ルームが見つかりません」を出す", async () => {
    const receiveRoomGet = serveRoomRemovedAfterFirstGet();
    server.use(
      http.get("/api/rooms/3/messages/", () => HttpResponse.json([])),
      http.post("/api/rooms/3/messages/", notFound),
    );

    renderRoute("/rooms/3");
    await submitBody("こんにちは");

    await expectRoomNotFound();
    expect(receiveRoomGet).toHaveBeenCalledTimes(2);
  });

  it("送信が 404 でも、ルームを取得できたら、エラーの Alert を出す", async () => {
    server.use(
      http.get("/api/rooms/3/messages/", () => HttpResponse.json([])),
      http.post("/api/rooms/3/messages/", notFound),
    );

    renderRoute("/rooms/3");
    await submitBody("こんにちは");

    expect(await screen.findByRole("alert")).toHaveTextContent("メッセージを送信できませんでした");
    expect(screen.getByRole("heading", { level: 2, name: "雑談" })).toBeInTheDocument();
  });

  it("メッセージの取得が 404 で、ルームも 404 になったら、「ルームが見つかりません」を出し、取り直しを止める", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    const receiveRoomGet = serveRoomRemovedAfterFirstGet();
    const receiveMessagesGet = vi.fn();
    server.use(
      http.get("/api/rooms/3/messages/", () => {
        receiveMessagesGet();
        return notFound();
      }),
    );

    renderRoute("/rooms/3");

    await expectRoomNotFound();
    expect(receiveRoomGet).toHaveBeenCalledTimes(2);
    expect(receiveMessagesGet).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(6000);
    expect(receiveMessagesGet).toHaveBeenCalledOnce();
    expect(receiveRoomGet).toHaveBeenCalledTimes(2);
  });
});

async function submitUsername(username: string) {
  const input = await screen.findByRole("textbox", { name: "招待する利用者名" });
  fireEvent.change(input, { target: { value: username } });
  fireEvent.click(screen.getByRole("button", { name: "招待する" }));
  return input;
}

describe("メンバー", () => {
  beforeEach(() => {
    server.use(http.get("/api/rooms/3/messages/", () => HttpResponse.json([])));
  });

  it("メンバーの利用者名を、加わった順に出す", async () => {
    server.use(
      http.get("/api/rooms/3/members/", () => HttpResponse.json([aliceMember, bobMember])),
    );

    renderRoute("/rooms/3");

    const items = within(await screen.findByRole("list", { name: "メンバー" })).getAllByRole(
      "listitem",
    );
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("alice");
    expect(items[1]).toHaveTextContent("bob");
  });

  it("招待すると POST を呼び、一覧を取り直して、入力欄を空にする", async () => {
    const receivePost = vi.fn();
    const receiveGet = vi.fn();
    server.use(
      http.get("/api/rooms/3/members/", () => {
        receiveGet();
        return HttpResponse.json(
          receivePost.mock.calls.length > 0 ? [aliceMember, carolMember] : [aliceMember],
        );
      }),
      http.post("/api/rooms/3/members/", async ({ request }) => {
        receivePost(await request.json());
        return HttpResponse.json(carolMember, { status: 201 });
      }),
    );

    renderRoute("/rooms/3");
    await screen.findByRole("list", { name: "メンバー" });
    const input = await submitUsername("carol");

    const list = screen.getByRole("list", { name: "メンバー" });
    expect(await within(list).findByText("carol")).toBeInTheDocument();
    expect(receivePost).toHaveBeenCalledExactlyOnceWith({ username: "carol" });
    expect(receiveGet).toHaveBeenCalledTimes(2);
    expect(input).toHaveValue("");
  });

  it("招待の途中にもう一度送っても POST は1回で、途中で打った次の利用者名は残す", async () => {
    const receivePost = vi.fn();
    const postResponse: { resolve: () => void } = { resolve: () => undefined };
    const postResponded = new Promise<void>((resolve) => {
      postResponse.resolve = resolve;
    });
    server.use(
      http.post("/api/rooms/3/members/", async ({ request }) => {
        receivePost(await request.json());
        await postResponded;
        return HttpResponse.json(carolMember, { status: 201 });
      }),
    );

    renderRoute("/rooms/3");
    const input = await submitUsername("carol");
    await vi.waitFor(() => {
      expect(receivePost).toHaveBeenCalledOnce();
    });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    fireEvent.change(input, { target: { value: "dave" } });
    postResponse.resolve();

    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: "招待する" })).not.toHaveAttribute("aria-disabled");
    });
    expect(receivePost).toHaveBeenCalledExactlyOnceWith({ username: "carol" });
    expect(input).toHaveValue("dave");
  });

  it("400 のときは、入力欄の下に username の項目の誤りを出し、入力を残す", async () => {
    server.use(
      http.post("/api/rooms/3/members/", () =>
        HttpResponse.json({ username: ["この利用者はいません。"] }, { status: 400 }),
      ),
    );

    renderRoute("/rooms/3");
    const input = await submitUsername("nobody");

    expect(await screen.findByText("この利用者はいません。")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("この利用者はいません。");
    expect(input).toHaveValue("nobody");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("すでにメンバーの 400 のときも、一覧を取り直す", async () => {
    const receivePost = vi.fn();
    server.use(
      http.get("/api/rooms/3/members/", () =>
        HttpResponse.json(
          receivePost.mock.calls.length > 0 ? [aliceMember, carolMember] : [aliceMember],
        ),
      ),
      http.post("/api/rooms/3/members/", () => {
        receivePost();
        return HttpResponse.json(
          { username: ["すでにこのルームのメンバーです。"] },
          { status: 400 },
        );
      }),
    );

    renderRoute("/rooms/3");
    await screen.findByRole("list", { name: "メンバー" });
    await submitUsername("carol");

    expect(await screen.findByText("すでにこのルームのメンバーです。")).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "メンバー" });
    expect(await within(list).findByText("carol")).toBeInTheDocument();
  });

  it("400 以外の招待の失敗なら、エラーの Alert を出す", async () => {
    server.use(http.post("/api/rooms/3/members/", () => new HttpResponse(null, { status: 500 })));

    renderRoute("/rooms/3");
    const input = await submitUsername("carol");

    expect(await screen.findByRole("alert")).toHaveTextContent("メンバーを招待できませんでした");
    expect(input).toHaveValue("carol");
  });

  it("400 以外の招待の失敗のあとも、一覧を取り直す", async () => {
    const receiveGet = vi.fn();
    server.use(
      http.get("/api/rooms/3/members/", () => {
        receiveGet();
        return HttpResponse.json([aliceMember]);
      }),
      http.post("/api/rooms/3/members/", () => new HttpResponse(null, { status: 500 })),
    );

    renderRoute("/rooms/3");
    await screen.findByRole("list", { name: "メンバー" });
    await submitUsername("carol");

    expect(await screen.findByRole("alert")).toHaveTextContent("メンバーを招待できませんでした");
    await vi.waitFor(() => {
      expect(receiveGet).toHaveBeenCalledTimes(2);
    });
  });

  it("招待の途中に利用者名を変えたら、送った利用者名への誤りは出さない", async () => {
    const receivePost = vi.fn();
    const postResponse: { resolve: () => void } = { resolve: () => undefined };
    const postResponded = new Promise<void>((resolve) => {
      postResponse.resolve = resolve;
    });
    server.use(
      http.post("/api/rooms/3/members/", async () => {
        receivePost();
        await postResponded;
        return HttpResponse.json({ username: ["この利用者はいません。"] }, { status: 400 });
      }),
    );

    renderRoute("/rooms/3");
    const input = await submitUsername("nobody");
    await vi.waitFor(() => {
      expect(receivePost).toHaveBeenCalledOnce();
    });
    fireEvent.change(input, { target: { value: "carol" } });
    postResponse.resolve();

    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: "招待する" })).not.toHaveAttribute("aria-disabled");
    });
    expect(screen.queryByText("この利用者はいません。")).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("メンバーの取得に失敗したら、エラーの Alert を出す", async () => {
    server.use(http.get("/api/rooms/3/members/", () => new HttpResponse(null, { status: 500 })));

    renderRoute("/rooms/3");

    expect(await screen.findByRole("alert")).toHaveTextContent("メンバーを取得できませんでした");
  });

  it("招待が 404 で、ルームも 404 になったら、「ルームが見つかりません」を出す", async () => {
    const receiveRoomGet = serveRoomRemovedAfterFirstGet();
    server.use(http.post("/api/rooms/3/members/", notFound));

    renderRoute("/rooms/3");
    await submitUsername("carol");

    await expectRoomNotFound();
    expect(receiveRoomGet).toHaveBeenCalledTimes(2);
  });

  it("メンバーの取得が 404 で、ルームも 404 になったら、「ルームが見つかりません」を出す", async () => {
    const receiveRoomGet = serveRoomRemovedAfterFirstGet();
    server.use(http.get("/api/rooms/3/members/", notFound));

    renderRoute("/rooms/3");

    await expectRoomNotFound();
    expect(receiveRoomGet).toHaveBeenCalledTimes(2);
  });
});
