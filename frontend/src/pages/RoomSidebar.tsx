import { Plus } from "lucide-react";
import { useRooms } from "../api/queries/rooms.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Link } from "../components/ui/Link.tsx";
import { RoomMark } from "../components/ui/RoomMark.tsx";
import { Skeleton } from "../components/ui/Skeleton.tsx";

function SidebarRooms({ currentRoomId }: { currentRoomId: number | null }) {
  const rooms = useRooms();

  if (rooms.isPending) {
    return <Skeleton label="ルームを読み込んでいます…" rows={4} />;
  }
  if (rooms.isError) {
    return <Alert tone="error">ルームの一覧を読み込めませんでした。</Alert>;
  }
  return (
    <ul className="space-y-0.5">
      {rooms.data.map((room) => (
        <li key={room.id}>
          <Link
            variant="nav"
            href={`/rooms/${room.id}`}
            aria-current={room.id === currentRoomId ? "page" : undefined}
          >
            <RoomMark name={room.name} size="sm" />
            <span className="truncate">{room.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function RoomSidebar({ currentRoomId }: { currentRoomId: number | null }) {
  return (
    <nav
      aria-label="ルーム"
      className="border-rule bg-paper hidden w-60 shrink-0 flex-col border-r lg:flex"
    >
      <div className="flex h-12 items-center justify-between px-4">
        <Link variant="quiet" href="/">
          ルーム
        </Link>
        <Link variant="quiet" href="/rooms/new">
          <Plus aria-hidden="true" className="size-4" />
          新しいルーム
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <SidebarRooms currentRoomId={currentRoomId} />
      </div>
    </nav>
  );
}
