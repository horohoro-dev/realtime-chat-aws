import { ChevronRight, Plus } from "lucide-react";
import { useRooms } from "../api/queries/rooms.ts";
import type { components } from "../api/schema.d.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Avatar } from "../components/ui/Avatar.tsx";
import { Link, LinkButton } from "../components/ui/Link.tsx";
import { Loading } from "../components/ui/Loading.tsx";
import { dateFormat } from "./format.ts";

type Room = components["schemas"]["Room"];

function RoomCard({ room }: { room: Room }) {
  return (
    <li className="group border-line bg-card ease-ui hover:border-line-strong has-[a:focus-visible]:border-line-strong relative flex items-center gap-4 rounded-md border px-4 py-4 transition-[translate,border-color,box-shadow] duration-[120ms] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgb(31_48_56/0.18)] hover:duration-[180ms] has-[a:focus-visible]:-translate-y-0.5 motion-reduce:hover:translate-none motion-reduce:has-[a:focus-visible]:translate-none sm:px-5">
      <Avatar name={room.name} shape="room" size="lg" />
      <div className="min-w-0 flex-1">
        <p className="text-ink truncate text-base font-semibold">
          <Link href={`/rooms/${room.id}`} variant="stretched">
            {room.name}
          </Link>
        </p>
        <p className="text-muted mt-0.5 truncate text-sm">
          {room.created_by.username} が{dateFormat.format(new Date(room.created_at))}に作成
        </p>
      </div>
      <ChevronRight
        aria-hidden="true"
        className="text-muted ease-ui size-5 shrink-0 transition-transform duration-[120ms] group-hover:translate-x-[3px] group-hover:duration-[150ms]"
      />
    </li>
  );
}

function RoomList() {
  const rooms = useRooms();

  if (rooms.isPending) {
    return <Loading>ルームを読み込んでいます</Loading>;
  }
  if (rooms.isError) {
    return (
      <Alert tone="error">
        ルームの一覧を取得できませんでした。少し待ってから、ページを読み込み直してください。
      </Alert>
    );
  }
  if (rooms.data.length === 0) {
    return (
      <div className="border-line-strong rounded-md border border-dashed px-6 py-12 text-center">
        <p className="text-base font-semibold">参加しているルームはありません</p>
        <p className="text-muted mx-auto mt-2 max-w-sm text-base leading-relaxed">
          ルームを作るか、ほかの人に招待されると、ここに並びます。
        </p>
      </div>
    );
  }
  return (
    <>
      <p className="text-muted mb-3 text-sm">{rooms.data.length}件</p>
      <ul aria-label="参加しているルーム" className="flex flex-col gap-2">
        {rooms.data.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </ul>
    </>
  );
}

export function RoomListPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">参加しているルーム</h2>
          <p className="text-muted mt-1 text-base">開くと、新しいメッセージが3秒ごとに届きます。</p>
        </div>
        <LinkButton href="/rooms/new">
          <Plus aria-hidden="true" className="size-4" strokeWidth={2.25} />
          ルームを作る
        </LinkButton>
      </div>
      <RoomList />
    </div>
  );
}
