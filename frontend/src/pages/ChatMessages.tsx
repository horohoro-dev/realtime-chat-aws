import { useEffect, useRef } from "react";
import { useMessages } from "../api/queries/messages.ts";
import type { components } from "../api/schema.d.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Avatar } from "../components/ui/Avatar.tsx";
import { Skeleton } from "../components/ui/Skeleton.tsx";
import { useSignedInUser } from "../hooks/useSignedInUser.ts";

type Message = components["schemas"]["Message"];

type MessageRow = {
  message: Message;
  isMine: boolean;
  startsGroup: boolean;
  startsDay: boolean;
};

const timeFormat = new Intl.DateTimeFormat("ja-JP", { hour: "numeric", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});
const fullFormat = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long", timeStyle: "short" });

const GROUP_WINDOW_MS = 5 * 60 * 1000;
// 一番下からこの距離までにいれば、新しいメッセージが来たときに一番下までついていく
const FOLLOW_THRESHOLD_PX = 120;

function dayKey(iso: string) {
  return dayFormat.format(new Date(iso));
}

// 同じ人が5分以内に続けて送ったメッセージは、名前と印を最初の1件にだけ出す
function toRows(messages: Message[], meId: number): MessageRow[] {
  return messages.map((message, index) => {
    const previous = index > 0 ? messages[index - 1] : undefined;
    const startsDay =
      previous === undefined || dayKey(previous.created_at) !== dayKey(message.created_at);
    const startsGroup =
      startsDay ||
      previous === undefined ||
      previous.sender.id !== message.sender.id ||
      Date.parse(message.created_at) - Date.parse(previous.created_at) > GROUP_WINDOW_MS;
    return { message, isMine: message.sender.id === meId, startsGroup, startsDay };
  });
}

function MessageTime({ iso }: { iso: string }) {
  const date = new Date(iso);
  return (
    <time
      dateTime={iso}
      title={fullFormat.format(date)}
      className="text-nezumi shrink-0 self-end pb-0.5 text-[0.6875rem]"
    >
      {timeFormat.format(date)}
    </time>
  );
}

function DaySeparator({ iso }: { iso: string }) {
  return (
    <div className="flex items-center gap-3 pt-4 pb-1">
      <span aria-hidden="true" className="bg-rule h-px flex-1" />
      <span className="text-nezumi text-xs font-semibold">{dayKey(iso)}</span>
      <span aria-hidden="true" className="bg-rule h-px flex-1" />
    </div>
  );
}

function MineRow({ row }: { row: MessageRow }) {
  return (
    <div className="flex justify-end gap-2 pl-12">
      <span className="sr-only">あなた</span>
      <MessageTime iso={row.message.created_at} />
      <p className="bg-kamenozoki text-kachi max-w-[36rem] min-w-0 rounded-2xl rounded-br-md px-3.5 py-2 text-[0.9375rem] leading-relaxed break-words whitespace-pre-wrap">
        {row.message.body}
      </p>
    </div>
  );
}

function OtherRow({ row }: { row: MessageRow }) {
  const { sender } = row.message;
  return (
    <div className="flex gap-2.5 pr-12">
      <span className="w-9 shrink-0">
        {row.startsGroup ? <Avatar username={sender.username} /> : null}
      </span>
      <div className="min-w-0">
        {row.startsGroup ? (
          <p className="text-sumi mb-1 text-[0.8125rem] font-semibold">{sender.username}</p>
        ) : (
          <span className="sr-only">{sender.username}</span>
        )}
        <div className="flex gap-2">
          <p className="border-rule bg-paper text-sumi max-w-[36rem] min-w-0 rounded-2xl rounded-tl-md border px-3.5 py-2 text-[0.9375rem] leading-relaxed break-words whitespace-pre-wrap">
            {row.message.body}
          </p>
          <MessageTime iso={row.message.created_at} />
        </div>
      </div>
    </div>
  );
}

// 日付が変わる最初のメッセージには、その日付の区切りを同じ項目の中に出す
function MessageItem({ row }: { row: MessageRow }) {
  return (
    <li data-author={row.isMine ? "self" : "other"} className={row.startsGroup ? "pt-3" : "pt-1"}>
      {row.startsDay ? <DaySeparator iso={row.message.created_at} /> : null}
      {row.isMine ? <MineRow row={row} /> : <OtherRow row={row} />}
    </li>
  );
}

function EmptyMessages() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-kachi font-bold">まだメッセージはありません</p>
      <p className="text-nezumi mt-1.5 text-sm">最初のメッセージを送って、会話を始めましょう。</p>
    </div>
  );
}

function MessageItems({ messages }: { messages: Message[] }) {
  const me = useSignedInUser();
  if (messages.length === 0) {
    return <EmptyMessages />;
  }
  const rows = toRows(messages, me.id);
  return (
    <ol aria-label="メッセージ" className="mx-auto max-w-3xl px-4 pt-2 pb-6 sm:px-6">
      {rows.map((row) => (
        <MessageItem key={row.message.id} row={row} />
      ))}
    </ol>
  );
}

export function ChatMessages({ roomId }: { roomId: number }) {
  const messages = useMessages(roomId);
  const me = useSignedInUser();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const followRef = useRef<boolean>(true);
  const last = messages.data?.at(-1);
  const lastId = last?.id;
  const lastIsMine = last !== undefined && last.sender.id === me.id;

  // 新しいメッセージが来たら、読んでいる位置が一番下の近くか、自分が送ったときだけ一番下まで動かす
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller === null || lastId === undefined) {
      return;
    }
    if (followRef.current || lastIsMine) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [lastId, lastIsMine]);

  function handleScroll() {
    const scroller = scrollerRef.current;
    if (scroller === null) {
      return;
    }
    followRef.current =
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < FOLLOW_THRESHOLD_PX;
  }

  return (
    <div ref={scrollerRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto">
      {messages.isPending ? (
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Skeleton label="メッセージを読み込んでいます…" rows={4} />
        </div>
      ) : null}
      {messages.isError ? (
        <div className="mx-auto max-w-3xl px-4 pt-4 sm:px-6">
          <Alert tone="error">
            メッセージを読み込めませんでした。しばらくしてから、ページを再読み込みしてください。
          </Alert>
        </div>
      ) : null}
      {messages.data === undefined ? null : <MessageItems messages={messages.data} />}
    </div>
  );
}
