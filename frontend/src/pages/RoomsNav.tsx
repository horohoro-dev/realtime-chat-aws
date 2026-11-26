import { Plus } from "lucide-react";
import { useRooms } from "../api/queries/rooms.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Avatar } from "../components/ui/Avatar.tsx";
import { Link } from "../components/ui/Link.tsx";
import { Loading } from "../components/ui/Loading.tsx";

function RoomsNavItems({ currentRoomId }: { currentRoomId: number | null }) {
  const rooms = useRooms();

  if (rooms.isPending) {
    return <Loading>読み込んでいます</Loading>;
  }
  if (rooms.isError) {
    return <Alert tone="error">ルームの一覧を取得できませんでした。</Alert>;
  }
  return (
    <ul className="flex flex-col gap-0.5">
      {rooms.data.map((room) => {
        const current = room.id === currentRoomId;
        return (
          <li
            key={room.id}
            className={`ease-ui relative flex items-center gap-3 rounded-sm py-2 pr-2 pl-3 transition-colors duration-[120ms] hover:duration-[150ms] ${
              current
                ? "bg-action-soft text-ink before:bg-action font-semibold before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full"
                : "text-ink/85 hover:bg-surface"
            }`}
          >
            <Avatar name={room.name} shape="room" size="sm" />
            <span className="min-w-0 truncate text-base">
              <Link
                href={`/rooms/${room.id}`}
                variant="stretched"
                aria-current={current ? "page" : undefined}
              >
                {room.name}
              </Link>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function RoomsNav({ currentRoomId }: { currentRoomId: number | null }) {
  return (
    <nav aria-label="ルーム" className="flex flex-col">
      <div className="border-line flex h-18 items-center justify-between border-b pr-4 pl-6">
        <p className="text-muted text-sm font-medium">ルーム</p>
        <Link href="/rooms/new" variant="quiet">
          <Plus aria-hidden="true" className="size-4" />
          <span className="text-sm">
            <span className="sr-only">ルームを</span>作る
          </span>
        </Link>
      </div>
      <div className="px-3 py-4">
        <RoomsNavItems currentRoomId={currentRoomId} />
      </div>
    </nav>
  );
}
