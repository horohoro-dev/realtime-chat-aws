import { ChevronLeft, SendHorizontal } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useMessages, useSendMessage } from "../api/queries/messages.ts";
import { useRoom } from "../api/queries/rooms.ts";
import type { components } from "../api/schema.d.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Form } from "../components/ui/Form.tsx";
import { Link } from "../components/ui/Link.tsx";
import { MessageField } from "../components/ui/MessageField.tsx";
import { Seal } from "../components/ui/Seal.tsx";
import { useSubmitLock } from "../hooks/useSubmitLock.ts";
import { useSignedInUser } from "../layouts/signedInUser.ts";
import { dayKey, formatDay, formatFullDateTime, formatTime } from "../lib/dateFormat.ts";
import { InviteButton, MembersButton } from "./RoomMembers.tsx";

type Message = components["schemas"]["Message"];
type Room = components["schemas"]["Room"];

// 同じ人の発言がこの間隔より短く続くときは、名前と印を省いてひとまとまりに見せる
const GROUPING_WINDOW_MS = 5 * 60 * 1000;
// 一覧の最下部からこの距離までにいるときだけ、新しいメッセージで最下部へ送る
const STICK_TO_BOTTOM_PX = 120;

// バックエンドの URL は room_id を正の整数としてだけ受け付ける
function parseRoomId(value: string | undefined): number | null {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) {
    return null;
  }
  const roomId = Number(value);
  return Number.isSafeInteger(roomId) ? roomId : null;
}

function RoomNotFound() {
  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-10">
      <h2 className="text-ink text-xl font-bold">ルームが見つかりません</h2>
      <p className="text-muted text-sm leading-relaxed">
        ルームがなくなったか、あなたがこのルームのメンバーではありません。メンバーの人に招待してもらうと入れます。
      </p>
      <Link href="/">ルームの一覧へ戻る</Link>
    </div>
  );
}

type MessageRow = {
  message: Message;
  startsDay: boolean;
  startsGroup: boolean;
};

function toRows(messages: Message[]): MessageRow[] {
  return messages.map((message, index) => {
    const previous = index === 0 ? undefined : messages[index - 1];
    const startsDay =
      previous === undefined || dayKey(previous.created_at) !== dayKey(message.created_at);
    const startsGroup =
      startsDay ||
      previous === undefined ||
      previous.sender.id !== message.sender.id ||
      Date.parse(message.created_at) - Date.parse(previous.created_at) > GROUPING_WINDOW_MS;
    return { message, startsDay, startsGroup };
  });
}

function MessageTime({ iso }: { iso: string }) {
  return (
    <time
      dateTime={iso}
      title={formatFullDateTime(iso)}
      className="text-muted shrink-0 pb-1 text-[11px] tabular-nums"
    >
      {formatTime(iso)}
    </time>
  );
}

function OwnMessage({ row }: { row: MessageRow }) {
  const { message, startsGroup } = row;
  return (
    <li data-sender="self" className={`flex justify-end ${startsGroup ? "mt-4" : "mt-1"}`}>
      <span className="sr-only">{message.sender.username}（あなた）</span>
      <div className="flex max-w-[min(36rem,85%)] items-end gap-2">
        <MessageTime iso={message.created_at} />
        <p
          className={`bg-ai-soft text-ink min-w-0 rounded-2xl px-3.5 py-2 text-[15px] leading-[1.75] break-words whitespace-pre-wrap ${startsGroup ? "rounded-tr-md" : ""}`}
        >
          {message.body}
        </p>
      </div>
    </li>
  );
}

function OthersMessage({ row }: { row: MessageRow }) {
  const { message, startsGroup } = row;
  return (
    <li data-sender="other" className={`flex gap-2.5 ${startsGroup ? "mt-4" : "mt-1"}`}>
      <div className="w-9 shrink-0">
        {startsGroup ? <Seal name={message.sender.username} /> : null}
      </div>
      <div className="max-w-[min(36rem,85%)] min-w-0">
        <p className={startsGroup ? "text-ink mb-1 text-[13px] font-semibold" : "sr-only"}>
          {message.sender.username}
        </p>
        <div className="flex items-end gap-2">
          <p
            className={`border-rule bg-surface text-ink min-w-0 rounded-2xl border px-3.5 py-2 text-[15px] leading-[1.75] break-words whitespace-pre-wrap ${startsGroup ? "rounded-tl-md" : ""}`}
          >
            {message.body}
          </p>
          <MessageTime iso={message.created_at} />
        </div>
      </div>
    </li>
  );
}

function MessageItems({ messages, myId }: { messages: Message[]; myId: number }) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <p className="text-ink font-semibold">まだメッセージはありません。</p>
        <p className="text-muted mt-2 text-sm leading-relaxed">
          下の入力欄から、このルームの最初のメッセージを送れます。
        </p>
      </div>
    );
  }
  return (
    <ol aria-label="メッセージ" className="mx-auto mt-auto w-full max-w-4xl px-3 pt-2 pb-4 sm:px-6">
      {toRows(messages).flatMap((row) => {
        const item =
          row.message.sender.id === myId ? (
            <OwnMessage key={row.message.id} row={row} />
          ) : (
            <OthersMessage key={row.message.id} row={row} />
          );
        if (!row.startsDay) {
          return [item];
        }
        return [
          <li
            key={`day-${row.message.id}`}
            role="none"
            className="text-muted mt-6 mb-2 flex items-center gap-3 text-[12px] font-medium first:mt-2"
          >
            <span className="bg-rule h-px flex-1" />
            <span>{formatDay(row.message.created_at)}</span>
            <span className="bg-rule h-px flex-1" />
          </li>,
          item,
        ];
      })}
    </ol>
  );
}

function MessageList({ roomId, myId }: { roomId: number; myId: number }) {
  const messages = useMessages(roomId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const lastMessage = messages.data?.at(-1);
  const lastMessageId = lastMessage?.id;
  const lastIsMine = lastMessage?.sender.id === myId;

  // 一覧はポーリングで伸びる。読み返している途中は位置を動かさず、最下部を見ているときと自分が送ったときだけ追う
  useEffect(() => {
    const element = scrollRef.current;
    if (element === null || lastMessageId === undefined) {
      return;
    }
    if (isNearBottomRef.current || lastIsMine) {
      element.scrollTop = element.scrollHeight;
    }
  }, [lastMessageId, lastIsMine]);

  function handleScroll() {
    const element = scrollRef.current;
    if (element === null) {
      return;
    }
    isNearBottomRef.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < STICK_TO_BOTTOM_PX;
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex min-h-0 flex-1 flex-col overflow-y-auto"
    >
      {messages.isPending ? (
        <p role="status" className="text-muted px-6 py-6 text-sm">
          メッセージを読み込んでいます…
        </p>
      ) : null}
      {messages.isError ? (
        <div className="mx-auto max-w-4xl px-3 pt-4 sm:px-6">
          <Alert tone="error">
            メッセージを取得できませんでした。接続を確かめて、ページを読み込み直してください。
          </Alert>
        </div>
      ) : null}
      {messages.data === undefined ? null : <MessageItems messages={messages.data} myId={myId} />}
    </div>
  );
}

function MessageForm({ roomId, roomName }: { roomId: number; roomName: string }) {
  // edits は入力が変わるたびに増える。同じ本文を打ち直した場合も含めて、送信の途中に入力が変わったかをこの回数で見分ける
  const [draft, setDraft] = useState({ body: "", edits: 0 });
  const sendMessage = useSendMessage(roomId);
  const submitLock = useSubmitLock();
  // 送った値から入力が変わったら、その値への誤りは出さない
  const validationErrors =
    sendMessage.data?.status === "invalid" && sendMessage.variables?.body === draft.body
      ? sendMessage.data.errors
      : {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // 送信の途中は送信のボタンが submit でなくなるが、Enter での送信は止まらない
    if (!submitLock.acquire()) {
      return;
    }
    const editsAtSend = draft.edits;
    sendMessage.mutate(
      { body: draft.body },
      {
        onSuccess: (result) => {
          if (result.status === "sent") {
            // 送信の途中に打ち始めた次の本文は残す
            setDraft((current) =>
              current.edits === editsAtSend ? { body: "", edits: current.edits + 1 } : current,
            );
          }
        },
        onSettled: submitLock.release,
      },
    );
  }

  function handleChange(value: string) {
    setDraft((current) => ({ body: value, edits: current.edits + 1 }));
  }

  return (
    <div className="border-rule shrink-0 border-t px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="mx-auto max-w-4xl space-y-2">
        {sendMessage.isError ? (
          <Alert tone="error">
            メッセージを送信できませんでした。入力した本文は残っています。もう一度送信してください。
          </Alert>
        ) : null}
        <Form layout="inline" onSubmit={handleSubmit} validationErrors={validationErrors}>
          {/* 本文の文字数の上限はバックエンドだけが検査し、超えたら 400 の body の誤りで返る */}
          <MessageField
            name="body"
            label="メッセージ"
            placeholder={`${roomName} にメッセージを送る`}
            value={draft.body}
            onChange={handleChange}
            isRequired
          />
          <Button type="submit" isPending={sendMessage.isPending}>
            <SendHorizontal aria-hidden="true" className="size-4" />
            <span className="max-sm:sr-only">送信する</span>
          </Button>
        </Form>
        <p className="text-muted text-[12px] max-sm:hidden">Enter で送信、Shift + Enter で改行</p>
      </div>
    </div>
  );
}

function ChatHeader({ room, myId }: { room: Room; myId: number }) {
  return (
    <header className="border-rule flex shrink-0 items-center gap-2 border-b px-2 py-2 sm:gap-3 sm:px-6">
      <span className="md:hidden">
        <Link variant="quiet" href="/" aria-label="ルームの一覧へ">
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
      </span>
      <span className="max-sm:hidden">
        <Seal name={room.name} shape="square" />
      </span>
      <h2 className="text-ink min-w-0 flex-1 truncate text-[17px] font-bold">{room.name}</h2>
      <MembersButton roomId={room.id} myId={myId} creatorId={room.created_by.id} />
      <InviteButton roomId={room.id} />
    </header>
  );
}

function ChatRoom({ roomId, myId }: { roomId: number; myId: number }) {
  const room = useRoom(roomId);

  if (room.isPending) {
    return (
      <p role="status" className="text-muted px-6 py-6 text-sm">
        ルームを読み込んでいます…
      </p>
    );
  }
  // 取り直しが失敗しても、前に取れたルームがあれば画面を出したままにする
  if (room.data === undefined) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <Alert tone="error">
          ルームを取得できませんでした。接続を確かめて、ページを読み込み直してください。
        </Alert>
      </div>
    );
  }
  if (room.data === null) {
    return <RoomNotFound />;
  }
  return (
    <div className="flex h-full flex-col">
      <ChatHeader room={room.data} myId={myId} />
      <MessageList roomId={roomId} myId={myId} />
      <MessageForm roomId={roomId} roomName={room.data.name} />
    </div>
  );
}

export function ChatPage() {
  const roomId = parseRoomId(useParams().roomId);
  const me = useSignedInUser();
  if (roomId === null) {
    return <RoomNotFound />;
  }
  return <ChatRoom key={roomId} roomId={roomId} myId={me.id} />;
}
