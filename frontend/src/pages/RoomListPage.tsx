import { ChevronRight, Plus } from "lucide-react";
import { useRooms } from "../api/queries/rooms.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Link } from "../components/ui/Link.tsx";
import { Seal } from "../components/ui/Seal.tsx";
import { formatShortDate } from "../lib/dateFormat.ts";

function RoomList() {
  const rooms = useRooms();

  if (rooms.isPending) {
    return (
      <p role="status" className="text-muted text-sm">
        ルームを読み込んでいます…
      </p>
    );
  }
  if (rooms.isError) {
    return (
      <Alert tone="error">
        ルームの一覧を取得できませんでした。接続を確かめて、ページを読み込み直してください。
      </Alert>
    );
  }
  if (rooms.data.length === 0) {
    return (
      <div className="border-rule rounded-2xl border border-dashed px-6 py-10 text-center">
        <p className="text-ink font-semibold">まだどのルームにも参加していません。</p>
        <p className="text-muted mt-2 text-sm leading-relaxed">
          「ルームを作る」から始めるか、ほかの人にルームへ招待してもらってください。
        </p>
      </div>
    );
  }
  return (
    <ul className="divide-rule border-rule bg-surface divide-y overflow-hidden rounded-2xl border">
      {rooms.data.map((room) => (
        <li
          key={room.id}
          className="hover:bg-paper/70 relative flex items-center gap-4 px-4 py-3.5 sm:px-5"
        >
          <Seal name={room.name} size="lg" shape="square" />
          <div className="min-w-0 flex-1">
            <Link variant="stretched" href={`/rooms/${room.id}`}>
              {room.name}
            </Link>
            <p className="text-muted mt-0.5 truncate text-[13px]">
              {room.created_by.username} さんが {formatShortDate(room.created_at)} に作成
            </p>
          </div>
          <ChevronRight aria-hidden="true" className="text-muted size-5 shrink-0" />
        </li>
      ))}
    </ul>
  );
}

export function RoomListPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:py-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-ink text-xl font-bold">参加しているルーム</h2>
          <Link variant="button" href="/rooms/new">
            <Plus aria-hidden="true" className="size-4" />
            ルームを作る
          </Link>
        </div>
        <RoomList />
      </div>
    </div>
  );
}
