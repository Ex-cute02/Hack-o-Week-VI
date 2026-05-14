import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("socket.io-client", () => ({
  io: () => ({
    on: () => {},
    emit: () => {},
    disconnect: () => {},
  }),
}));

describe("App", () => {
  it("renders dashboard heading", () => {
    render(<App />);
    expect(screen.getByText(/Real-time college alerts/i)).toBeDefined();
  });
});
