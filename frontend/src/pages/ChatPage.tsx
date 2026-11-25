import { useParams } from "react-router";

export function ChatPage() {
  const { roomId } = useParams();
  return <h2 className="text-xl font-semibold">ルーム {roomId}</h2>;
}
