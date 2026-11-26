import { ChevronRight, Plus } from "lucide-react";
import { useRooms } from "../api/queries/rooms.ts";
import type { components } from "../api/schema.d.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Link } from "../components/ui/Link.tsx";
import { RoomMark } from "../components/ui/RoomMark.tsx";
import { Skeleton } from "../components/ui/Skeleton.tsx";

type Room = components["schemas"]["Room"];

const createdDateFormat = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" });

function RoomRow({ room }: { room: Room }) {
  const metaId = `room-${room.id}-meta`;
  return (
    <li className="hover:bg-kamenozoki/50 relative flex items-center gap-4 px-4 py-3.5 transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg">
      <RoomMark name={room.name} />
      <div className="min-w-0 flex-1">
        <Link variant="stretched" href={`/rooms/${room.id}`} aria-describedby={metaId}>
          {room.name}
        </Link>
        <p id={metaId} className="text-nezumi mt-0.5 truncate text-xs">
          {room.created_by.username} が作成 ・{" "}
          <time dateTime={room.created_at}>
            {createdDateFormat.format(new Date(room.created_at))}
          </time>
        </p>
      </div>
      <ChevronRight aria-hidden="true" className="text-asagi size-4 shrink-0" />
    </li>
  );
}

function EmptyRooms() {
  return (
    <div className="border-mizu bg-paper rounded-lg border border-dashed px-6 py-10 text-center">
      <p className="text-kachi font-bold">まだどのルームにも参加していません</p>
      <p className="text-nezumi mx-auto mt-1.5 max-w-sm text-sm leading-relaxed">
        ルームを作るか、ほかの人にルームへ招待してもらうと、ここに表示されます。
      </p>
      <div className="mt-5">
        <Link variant="secondary" href="/rooms/new">
          最初のルームを作る
        </Link>
      </div>
    </div>
  );
}

function RoomList() {
  const rooms = useRooms();

  if (rooms.isPending) {
    return (
      <div className="border-rule bg-paper rounded-lg border p-4">
        <Skeleton label="ルームを読み込んでいます…" />
      </div>
    );
  }
  if (rooms.isError) {
    return (
      <Alert tone="error">
        ルームの一覧を読み込めませんでした。しばらくしてから、ページを再読み込みしてください。
      </Alert>
    );
  }
  if (rooms.data.length === 0) {
    return <EmptyRooms />;
  }
  return (
    <ul
      aria-label="参加しているルーム"
      className="divide-rule border-rule bg-paper divide-y rounded-lg border shadow-[0_1px_2px_oklch(0.23_0.045_266/0.05)]"
    >
      {rooms.data.map((room) => (
        <RoomRow key={room.id} room={room} />
      ))}
    </ul>
  );
}

export function RoomListPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-kachi text-2xl font-bold">ルーム</h2>
            <p className="text-nezumi mt-1 text-sm">参加しているルームを開いて、会話を始めます。</p>
          </div>
          <Link variant="primary" href="/rooms/new">
            <Plus aria-hidden="true" className="size-4" strokeWidth={2.5} />
            新しいルーム
          </Link>
        </div>
        <RoomList />
      </div>
    </div>
  );
}
