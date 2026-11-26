import { act, fireEvent, screen, within } from "@testing-library/react";
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
    http.get("/api/rooms/", () => HttpResponse.json([room])),
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
  expect(screen.getByRole("link", { name: "ルームの一覧に戻る" })).toHaveAttribute("href", "/");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
}

async function submitBody(body: string) {
  const input = await screen.findByRole("textbox", { name: "メッセージ" });
  fireEvent.change(input, { target: { value: body } });
  fireEvent.click(screen.getByRole("button", { name: "送信" }));
  return input;
}

describe("チャット", () => {
  it("ルームの名前と、メッセージの送った人、本文、時刻、日付の区切りを出す", async () => {
    server.use(
      http.get("/api/rooms/3/messages/", () => HttpResponse.json([firstMessage, secondMessage])),
    );

    renderRoute("/rooms/3");

    expect(await screen.findByRole("heading", { level: 2, name: "雑談" })).toBeInTheDocument();
    const items = within(await screen.findByRole("list", { name: "メッセージ" })).getAllByRole(
      "listitem",
    );
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("あなた");
    expect(items[0]).toHaveTextContent("おはようございます");
    expect(items[0]).toHaveTextContent("2026年11月3日(火)");
    expect(items[1]).toHaveTextContent("bob");
    expect(items[1]).toHaveTextContent("今日もよろしく");
    expect(items[1]).not.toHaveTextContent("2026年11月3日");
    const time = items[0]?.querySelector("time");
    expect(time).toHaveAttribute("dateTime", "2026-11-03T09:00:00Z");
    expect(time).toHaveTextContent("9:00");
  });

  it("自分の発言は右寄せ（self）、ほかの人の発言は左寄せ（other）で、ほかの人には名前を出す", async () => {
    server.use(
      http.get("/api/rooms/3/messages/", () => HttpResponse.json([firstMessage, secondMessage])),
    );

    renderRoute("/rooms/3");

    const items = within(await screen.findByRole("list", { name: "メッセージ" })).getAllByRole(
      "listitem",
    );
    expect(items[0]).toHaveAttribute("data-author", "self");
    expect(items[0]).not.toHaveTextContent("alice");
    expect(items[1]).toHaveAttribute("data-author", "other");
    expect(items[1]).toHaveTextContent("bob");
  });

  it("同じ人が5分以内に続けて送ったメッセージは、名前を最初の1件にだけ見えるように出す", async () => {
    const followUp = {
      ...secondMessage,
      id: 12,
      body: "資料も見ます",
      created_at: "2026-11-03T09:07:00Z",
    };
    const later = {
      ...secondMessage,
      id: 13,
      body: "戻りました",
      created_at: "2026-11-03T09:30:00Z",
    };
    server.use(
      http.get("/api/rooms/3/messages/", () =>
        HttpResponse.json([firstMessage, secondMessage, followUp, later]),
      ),
    );

    renderRoute("/rooms/3");

    const list = await screen.findByRole("list", { name: "メッセージ" });
    const visibleNames = within(list)
      .getAllByText("bob")
      .filter((element) => !element.classList.contains("sr-only"));
    expect(visibleNames).toHaveLength(2);
  });

  it("メッセージがないときは、その旨を出す", async () => {
    server.use(http.get("/api/rooms/3/messages/", () => HttpResponse.json([])));

    renderRoute("/rooms/3");

    expect(await screen.findByText("まだメッセージはありません")).toBeInTheDocument();
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

    const list = screen.getByRole("list", { name: "メッセージ" });
    expect(await within(list).findByText("今日もよろしく")).toBeInTheDocument();
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
      expect(screen.getByRole("button", { name: "送信" })).not.toHaveAttribute("aria-disabled");
    });
    expect(receivePost).toHaveBeenCalledExactlyOnceWith({ body: "今日もよろしく" });
    expect(input).toHaveValue("次の本文");
  });

  it("送信の状態が画面に届く前にもう一度送っても POST は1回", async () => {
    const receivePost = vi.fn();
    server.use(
      http.get("/api/rooms/3/messages/", () => HttpResponse.json([firstMessage])),
      http.post("/api/rooms/3/messages/", async ({ request }) => {
        receivePost(await request.json());
        return HttpResponse.json({ ...secondMessage, sender: alice }, { status: 201 });
      }),
    );

    renderRoute("/rooms/3");
    await screen.findByText("おはようございます");
    const input = await screen.findByRole("textbox", { name: "メッセージ" });
    fireEvent.change(input, { target: { value: "今日もよろしく" } });
    const form = input.closest("form") as HTMLFormElement;
    fireEvent.submit(form);
    fireEvent.submit(form);

    await vi.waitFor(() => {
      expect(input).toHaveValue("");
    });
    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: "送信" })).not.toHaveAttribute("aria-disabled");
    });
    expect(receivePost).toHaveBeenCalledExactlyOnceWith({ body: "今日もよろしく" });
  });

  it("送信が終わったあとは、次の本文を送れる", async () => {
    const receivePost = vi.fn();
    server.use(
      http.get("/api/rooms/3/messages/", () => HttpResponse.json([firstMessage])),
      http.post("/api/rooms/3/messages/", async ({ request }) => {
        receivePost(await request.json());
        return HttpResponse.json({ ...secondMessage, sender: alice }, { status: 201 });
      }),
    );

    renderRoute("/rooms/3");
    await screen.findByText("おはようございます");
    const input = await submitBody("今日もよろしく");
    await vi.waitFor(() => {
      expect(input).toHaveValue("");
    });
    await submitBody("次の本文");

    await vi.waitFor(() => {
      expect(receivePost).toHaveBeenCalledTimes(2);
    });
    expect(receivePost).toHaveBeenLastCalledWith({ body: "次の本文" });
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
      expect(screen.getByRole("button", { name: "送信" })).not.toHaveAttribute("aria-disabled");
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
      expect.stringContaining("この項目が2000文字より長くならないようにしてください。"),
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

  it("Enter で送信し、Shift + Enter と変換中の Enter では送信しない", async () => {
    const receivePost = vi.fn();
    server.use(
      http.get("/api/rooms/3/messages/", () => HttpResponse.json([])),
      http.post("/api/rooms/3/messages/", async ({ request }) => {
        receivePost(await request.json());
        return HttpResponse.json({ ...secondMessage, sender: alice }, { status: 201 });
      }),
    );

    renderRoute("/rooms/3");
    const input = await screen.findByRole("textbox", { name: "メッセージ" });
    fireEvent.change(input, { target: { value: "了解です" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    expect(receivePost).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Enter" });

    await vi.waitFor(() => {
      expect(receivePost).toHaveBeenCalledExactlyOnceWith({ body: "了解です" });
    });
  });

  it("404 のときは「ルームが見つかりません」と一覧へのリンクを出す", async () => {
    server.use(
      http.get("/api/rooms/3/", () => HttpResponse.json({ detail: "Not found." }, { status: 404 })),
    );

    renderRoute("/rooms/3");

    expect(
      await screen.findByRole("heading", { level: 2, name: "ルームが見つかりません" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ルームの一覧に戻る" })).toHaveAttribute("href", "/");
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

    expect(await screen.findByRole("alert")).toHaveTextContent("ルームを読み込めませんでした");
  });

  it("メッセージの取得に失敗したら、エラーの Alert を出す", async () => {
    server.use(http.get("/api/rooms/3/messages/", () => new HttpResponse(null, { status: 500 })));

    renderRoute("/rooms/3");

    expect(await screen.findByRole("alert")).toHaveTextContent("メッセージを読み込めませんでした");
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

  it("メッセージの取得が 404 なら、ルームを取得できても、メッセージの取り直しを止める", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    const receiveMessagesGet = vi.fn();
    server.use(
      http.get("/api/rooms/3/messages/", () => {
        receiveMessagesGet();
        return notFound();
      }),
    );

    renderRoute("/rooms/3");

    expect(await screen.findByRole("alert")).toHaveTextContent("メッセージを読み込めませんでした");
    await vi.advanceTimersByTimeAsync(6000);
    expect(receiveMessagesGet).toHaveBeenCalledOnce();
  });

  it("送信の 404 のあと、ルームの取り直しが失敗しても、チャットの画面を出したままにする", async () => {
    const receiveRoomGet = vi.fn();
    server.use(
      http.get("/api/rooms/3/", () => {
        receiveRoomGet();
        return receiveRoomGet.mock.calls.length === 1
          ? HttpResponse.json(room)
          : new HttpResponse(null, { status: 500 });
      }),
      http.get("/api/rooms/3/messages/", () => HttpResponse.json([])),
      http.post("/api/rooms/3/messages/", notFound),
    );

    renderRoute("/rooms/3");
    await submitBody("こんにちは");

    expect(await screen.findByRole("alert")).toHaveTextContent("メッセージを送信できませんでした");
    await vi.waitFor(() => {
      expect(receiveRoomGet).toHaveBeenCalledTimes(5);
    });
    expect(screen.getByRole("heading", { level: 2, name: "雑談" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "メッセージ" })).toBeInTheDocument();
  });
});

async function openInviteDialog() {
  fireEvent.click(await screen.findByRole("button", { name: "メンバーを招待" }));
  return screen.findByRole("dialog", { name: "メンバーを招待" });
}

function closeDialog() {
  fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
}

async function submitUsername(username: string) {
  if (screen.queryByRole("dialog", { name: "メンバーを招待" }) === null) {
    await openInviteDialog();
  }
  const input = await screen.findByRole("textbox", { name: "利用者名" });
  fireEvent.change(input, { target: { value: username } });
  fireEvent.click(screen.getByRole("button", { name: "招待する" }));
  return input;
}

describe("メンバー", () => {
  beforeEach(() => {
    server.use(http.get("/api/rooms/3/messages/", () => HttpResponse.json([])));
  });

  it("メンバーの利用者名を、加わった順に、人数と自分の印を付けて出す", async () => {
    server.use(
      http.get("/api/rooms/3/members/", () => HttpResponse.json([aliceMember, bobMember])),
    );

    renderRoute("/rooms/3");

    const items = within(await screen.findByRole("list", { name: "メンバー" })).getAllByRole(
      "listitem",
    );
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("alice");
    expect(items[0]).toHaveTextContent("あなた");
    expect(items[1]).toHaveTextContent("bob");
    expect(items[1]).not.toHaveTextContent("あなた");
    expect(await screen.findByRole("complementary", { name: "メンバー 2人" })).toBeInTheDocument();
  });

  it("メンバーのボタンを押すと、メンバーの一覧のダイアログを開く", async () => {
    server.use(
      http.get("/api/rooms/3/members/", () => HttpResponse.json([aliceMember, bobMember])),
    );

    renderRoute("/rooms/3");
    fireEvent.click(await screen.findByRole("button", { name: "メンバー（2人）" }));

    const dialog = await screen.findByRole("dialog", { name: "メンバー" });
    const items = within(within(dialog).getByRole("list", { name: "メンバー" })).getAllByRole(
      "listitem",
    );
    expect(items).toHaveLength(2);
  });

  it("「メンバーを招待」を押すと、利用者名の入力欄にフォーカスしたダイアログを開き、閉じるとボタンにフォーカスを戻す", async () => {
    renderRoute("/rooms/3");
    const trigger = await screen.findByRole("button", { name: "メンバーを招待" });
    act(() => {
      trigger.focus();
    });

    const dialog = await openInviteDialog();
    const input = within(dialog).getByRole("textbox", { name: "利用者名" });
    await vi.waitFor(() => {
      expect(input).toHaveFocus();
    });

    closeDialog();

    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    await vi.waitFor(() => {
      expect(trigger).toHaveFocus();
    });
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

    expect(await screen.findByRole("status")).toHaveTextContent("carol さんをメンバーに加えました");
    expect(receivePost).toHaveBeenCalledExactlyOnceWith({ username: "carol" });
    await vi.waitFor(() => {
      expect(receiveGet).toHaveBeenCalledTimes(2);
    });
    expect(input).toHaveValue("");

    closeDialog();
    const list = await screen.findByRole("list", { name: "メンバー" });
    expect(await within(list).findByText("carol")).toBeInTheDocument();
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

  it("招待の状態が画面に届く前にもう一度送っても POST は1回", async () => {
    const receivePost = vi.fn();
    server.use(
      http.post("/api/rooms/3/members/", async ({ request }) => {
        receivePost(await request.json());
        return HttpResponse.json(carolMember, { status: 201 });
      }),
    );

    renderRoute("/rooms/3");
    await openInviteDialog();
    const input = await screen.findByRole("textbox", { name: "利用者名" });
    fireEvent.change(input, { target: { value: "carol" } });
    const form = input.closest("form") as HTMLFormElement;
    fireEvent.submit(form);
    fireEvent.submit(form);

    await vi.waitFor(() => {
      expect(input).toHaveValue("");
    });
    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: "招待する" })).not.toHaveAttribute("aria-disabled");
    });
    expect(receivePost).toHaveBeenCalledExactlyOnceWith({ username: "carol" });
  });

  it("400 のあとは、利用者名を直してもう一度招待できる", async () => {
    const receivePost = vi.fn();
    server.use(
      http.post("/api/rooms/3/members/", async ({ request }) => {
        const body = await request.json();
        receivePost(body);
        return receivePost.mock.calls.length === 1
          ? HttpResponse.json({ username: ["この利用者はいません。"] }, { status: 400 })
          : HttpResponse.json(carolMember, { status: 201 });
      }),
    );

    renderRoute("/rooms/3");
    await submitUsername("nobody");
    expect(await screen.findByText("この利用者はいません。")).toBeInTheDocument();
    const input = await submitUsername("carol");

    await vi.waitFor(() => {
      expect(input).toHaveValue("");
    });
    expect(receivePost).toHaveBeenCalledTimes(2);
    expect(receivePost).toHaveBeenLastCalledWith({ username: "carol" });
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
    closeDialog();
    const list = await screen.findByRole("list", { name: "メンバー" });
    expect(await within(list).findByText("carol")).toBeInTheDocument();
  });

  it("400 以外の招待の失敗なら、エラーの Alert を出す", async () => {
    server.use(http.post("/api/rooms/3/members/", () => new HttpResponse(null, { status: 500 })));

    renderRoute("/rooms/3");
    const input = await submitUsername("carol");

    expect(await screen.findByRole("alert")).toHaveTextContent("招待できませんでした");
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

    expect(await screen.findByRole("alert")).toHaveTextContent("招待できませんでした");
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

    expect(await screen.findByRole("alert")).toHaveTextContent("メンバーを読み込めませんでした");
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
