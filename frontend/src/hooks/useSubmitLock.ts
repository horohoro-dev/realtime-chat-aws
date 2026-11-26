import { useRef } from "react";

// ミューテーションの isPending は、TanStack Query の notifyManager が setTimeout で遅らせて React に届ける。
// 届く前に続けて来た送信も止められるように、送信の途中かを ref に同期的に記録する。
// acquire と release はイベントハンドラーとミューテーションのコールバックの中でだけ呼ぶ（描画中に ref を触らない）。
// release は mutate の onSettled で呼ぶ。TanStack Query v5 はアンマウントしたあとの mutate のコールバックを呼ばないが、
// そのときは ref もコンポーネントといっしょに捨てられるので、記録は残らない
export function useSubmitLock() {
  const lockedRef = useRef<boolean>(false);

  // 送信の途中なら false を返す
  function acquire(): boolean {
    if (lockedRef.current) {
      return false;
    }
    lockedRef.current = true;
    return true;
  }

  function release() {
    lockedRef.current = false;
  }

  return { acquire, release };
}
