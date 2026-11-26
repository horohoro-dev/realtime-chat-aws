import { useOutletContext } from "react-router";
import type { components } from "../api/schema.d.ts";

type User = components["schemas"]["User"];

// ログインを確かめたあとの画面でだけ使える。利用者は親のルートが Outlet の context で渡す
export function useCurrentUser(): User {
  return useOutletContext<User>();
}
