import { type UIEvent, useEffect, useRef } from "react";
import { useMessages } from "../api/queries/messages.ts";
import type { components } from "../api/schema.d.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Avatar } from "../components/ui/Avatar.tsx";
import { Loading } from "../components/ui/Loading.tsx";
import { dateTimeFormat, dayFormat, dayKey, timeFormat } from "./format.ts";

type Message = components["schemas"]["Message"];

// 同じ人が続けて送ったメッセージは、この時間の内なら名前とアバターを省いてまとめる
const GROUP_WINDOW_MS = 5 * 60 * 1000;

// 一番下からこの距離の内にいるときだけ、新しいメッセージが届いたら一番下まで送る
const STICK_TO_BOTTOM_PX = 96;

type MessageRow = {
  message: Message;
  mine: boolean;
  startsDay: boolean;
  continues: boolean;
};

function toRows(messages: Message[], myId: number): MessageRow[] {
  return messages.map((message, index) => {
    const previous = messages[index - 1];
    const sentAt = new Date(message.created_at);
    const previousAt = previous === undefined ? undefined : new Date(previous.created_at);
    const startsDay = previousAt === undefined || dayKey(previousAt) !== dayKey(sentAt);
    const continues =
      previous !== undefined &&
      previousAt !== undefined &&
      !startsDay &&
      previous.sender.id === message.sender.id &&
      sentAt.getTime() - previousAt.getTime() < GROUP_WINDOW_MS;
    return { message, mine: message.sender.id === myId, startsDay, continues };
  });
}

function MessageTime({ value }: { value: string }) {
  const date = new Date(value);
  return (
    <time dateTime={value} title={dateTimeFormat.format(date)} className="text-muted text-[13px]">
      {timeFormat.format(date)}
    </time>
  );
}

type Side = "me" | "other";

const sideStyles: Record<Side, { row: string; column: string; bubble: string; corner: string }> = {
  me: {
    row: "flex-row-reverse",
    column: "items-end",
    bubble: "bg-ink text-white",
    corner: "rounded-tr-[4px]",
  },
  other: {
    row: "",
    column: "items-start",
    bubble: "border border-line bg-card text-ink",
    corner: "rounded-tl-[4px]",
  },
};

function SenderAvatar({ row }: { row: MessageRow }) {
  if (row.mine) {
    return null;
  }
  if (row.continues) {
    return <span aria-hidden="true" className="w-9 shrink-0" />;
  }
  return <Avatar name={row.message.sender.username} />;
}

function DayDivider({ value }: { value: string }) {
  return (
    <p className="text-muted mt-4 mb-6 flex items-center gap-3 text-[13px]">
      <span aria-hidden="true" className="bg-line h-px flex-1" />
      {dayFormat.format(new Date(value))}
      <span aria-hidden="true" className="bg-line h-px flex-1" />
    </p>
  );
}

function MessageItem({ row }: { row: MessageRow }) {
  const { message, mine, startsDay, continues } = row;
  const side: Side = mine ? "me" : "other";
  const styles = sideStyles[side];
  return (
    <li data-sender={side} className={continues ? "mt-1" : "mt-5 first:mt-0"}>
      {startsDay ? <DayDivider value={message.created_at} /> : null}
      <div className={`flex items-start gap-3 ${styles.row}`}>
        <SenderAvatar row={row} />
        <div className={`flex max-w-[min(36rem,80%)] min-w-0 flex-col ${styles.column}`}>
          {continues ? null : (
            <p className="mb-1 flex items-baseline gap-2 text-sm">
              <span className="text-ink font-medium">
                {mine ? "あなた" : message.sender.username}
              </span>
              <MessageTime value={message.created_at} />
            </p>
          )}
          <div className={`flex items-end gap-2 ${styles.row}`}>
            <p
              className={`rounded-md px-4 py-2.5 text-base leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap ${styles.bubble} ${continues ? "" : styles.corner}`}
            >
              {message.body}
            </p>
            {continues ? (
              <span className="shrink-0 pb-1">
                <MessageTime value={message.created_at} />
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

function MessageItems({ messages, myId }: { messages: Message[]; myId: number }) {
  if (messages.length === 0) {
    return (
      <div className="m-auto max-w-sm py-12 text-center">
        <p className="text-base font-semibold">メッセージはまだありません</p>
        <p className="text-muted mt-2 text-base leading-relaxed">
          下の欄から送ったメッセージが、ここに古い順に並びます。
        </p>
      </div>
    );
  }
  return (
    <ol aria-label="メッセージ" className="flex flex-col">
      {toRows(messages, myId).map((row) => (
        <MessageItem key={row.message.id} row={row} />
      ))}
    </ol>
  );
}

export function MessageList({ roomId, myId }: { roomId: number; myId: number }) {
  const messages = useMessages(roomId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const lastMessageId = messages.data?.at(-1)?.id;

  // スクロールの位置は React の外の DOM の状態なので、描画のあとに合わせる
  useEffect(() => {
    const element = scrollRef.current;
    if (lastMessageId === undefined || element === null || !nearBottomRef.current) {
      return;
    }
    element.scrollTop = element.scrollHeight;
  }, [lastMessageId]);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    nearBottomRef.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < STICK_TO_BOTTOM_PX;
  }

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end gap-4 px-4 py-6 sm:px-6">
        {messages.isPending ? (
          <div className="m-auto">
            <Loading>メッセージを読み込んでいます</Loading>
          </div>
        ) : null}
        {messages.isError ? (
          <Alert tone="error">
            メッセージを取得できませんでした。少し待ってから、ページを読み込み直してください。
          </Alert>
        ) : null}
        {messages.data === undefined ? null : <MessageItems messages={messages.data} myId={myId} />}
      </div>
    </div>
  );
}
