import { type FormEvent, useState } from "react";
import { useParams } from "react-router";
import { useMessages, useSendMessage } from "../api/queries/messages.ts";
import { useRoom } from "../api/queries/rooms.ts";
import type { components } from "../api/schema.d.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Form } from "../components/ui/Form.tsx";
import { Link } from "../components/ui/Link.tsx";
import { TextField } from "../components/ui/TextField.tsx";
import { RoomMembers } from "./RoomMembers.tsx";

type Message = components["schemas"]["Message"];

const dateTimeFormat = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
});

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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">ルームが見つかりません</h2>
      <Link href="/">ルームの一覧へ戻る</Link>
    </div>
  );
}

function MessageItem({ message }: { message: Message }) {
  return (
    <li className="space-y-1 rounded-md border border-gray-200 px-4 py-3">
      <div className="flex items-baseline gap-2 text-sm">
        <span className="font-medium">{message.sender.username}</span>
        <time dateTime={message.created_at} className="text-gray-600">
          {dateTimeFormat.format(new Date(message.created_at))}
        </time>
      </div>
      <p className="break-words whitespace-pre-wrap">{message.body}</p>
    </li>
  );
}

function MessageItems({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return <p className="text-sm text-gray-600">メッセージはまだありません。</p>;
  }
  return (
    <ol aria-label="メッセージ" className="space-y-2">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </ol>
  );
}

function MessageList({ roomId }: { roomId: number }) {
  const messages = useMessages(roomId);

  if (messages.isPending) {
    return (
      <p role="status" className="text-sm text-gray-600">
        メッセージを読み込んでいます…
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {messages.isError ? (
        <Alert tone="error">
          メッセージを取得できませんでした。時間をおいて、ページを読み込み直してください。
        </Alert>
      ) : null}
      {messages.data === undefined ? null : <MessageItems messages={messages.data} />}
    </div>
  );
}

function MessageForm({ roomId }: { roomId: number }) {
  // edits は入力が変わるたびに増える。同じ本文を打ち直した場合も含めて、送信の途中に入力が変わったかをこの回数で見分ける
  const [draft, setDraft] = useState({ body: "", edits: 0 });
  const sendMessage = useSendMessage(roomId);
  // 送った値から入力が変わったら、その値への誤りは出さない
  const validationErrors =
    sendMessage.data?.status === "invalid" && sendMessage.variables?.body === draft.body
      ? sendMessage.data.errors
      : {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // 送信の途中は送信のボタンが submit でなくなるが、Enter での送信は止まらない
    if (sendMessage.isPending) {
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
      },
    );
  }

  function handleChange(value: string) {
    setDraft((current) => ({ body: value, edits: current.edits + 1 }));
  }

  return (
    <div className="space-y-4">
      {sendMessage.isError ? (
        <Alert tone="error">
          メッセージを送信できませんでした。時間をおいて、もう一度お試しください。
        </Alert>
      ) : null}
      <Form onSubmit={handleSubmit} validationErrors={validationErrors}>
        {/* 本文の文字数の上限はバックエンドだけが検査し、超えたら 400 の body の誤りで返る */}
        <TextField
          name="body"
          label="メッセージ"
          value={draft.body}
          onChange={handleChange}
          isRequired
        />
        <Button type="submit" isPending={sendMessage.isPending}>
          送信する
        </Button>
      </Form>
    </div>
  );
}

function ChatRoom({ roomId }: { roomId: number }) {
  const room = useRoom(roomId);

  if (room.isPending) {
    return (
      <p role="status" className="text-sm text-gray-600">
        ルームを読み込んでいます…
      </p>
    );
  }
  if (room.isError) {
    return (
      <Alert tone="error">
        ルームを取得できませんでした。時間をおいて、ページを読み込み直してください。
      </Alert>
    );
  }
  if (room.data === null) {
    return <RoomNotFound />;
  }
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{room.data.name}</h2>
      <MessageList roomId={roomId} />
      <MessageForm roomId={roomId} />
      <RoomMembers roomId={roomId} />
    </div>
  );
}

export function ChatPage() {
  const roomId = parseRoomId(useParams().roomId);
  if (roomId === null) {
    return <RoomNotFound />;
  }
  return <ChatRoom key={roomId} roomId={roomId} />;
}
