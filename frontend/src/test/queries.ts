import { screen } from "@testing-library/react";

// ヘッダーの「<利用者名> でログイン中」は、利用者名と続きの文が別の要素に分かれている
export function findLoggedInAs(username: string) {
  return screen.findByText(
    (_content, element) =>
      element?.tagName === "SPAN" && element.textContent === `${username} でログイン中`,
  );
}

export function queryLoggedInAs(username: string) {
  return screen.queryByText(
    (_content, element) =>
      element?.tagName === "SPAN" && element.textContent === `${username} でログイン中`,
  );
}
