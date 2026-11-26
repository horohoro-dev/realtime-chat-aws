import { render, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { expect, it } from "vitest";
import { App } from "./App.tsx";
import { server } from "./test/server.ts";

it("見出しとルームの一覧の画面を表示する", async () => {
  server.use(http.get("/api/me/", () => HttpResponse.json({ id: 1, username: "alice" })));

  render(<App />);

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("チャット");
  expect(await screen.findByRole("heading", { level: 2 })).toHaveTextContent("ルーム");
});
