/* @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Settings from "./Settings";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

describe("Settings", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.mocked(useTheme).mockReturnValue({
      theme: "light",
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    } as never);
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "u1", email: "user@test.com" },
      signOut: vi.fn(),
      sendPasswordResetEmail: vi.fn().mockResolvedValue({ error: null }),
    } as never);
  });

  it("renders account and preferences sections", () => {
    render(<Settings />);
    expect(screen.getByRole("heading", { name: "Paramètres" })).toBeTruthy();
    expect(screen.getByText("user@test.com")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Changer le mot de passe" })).toBeTruthy();
  });
});
