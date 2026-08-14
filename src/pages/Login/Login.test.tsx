/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Login from "./Login";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";

describe("Login", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      signIn: vi.fn().mockResolvedValue({ error: null }),
    } as never);
  });

  it("renders login form", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "PlanMyJob" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeTruthy();
  });

  it("shows error when sign in fails", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      signIn: vi.fn().mockResolvedValue({ error: { message: "Invalid login" } }),
    } as never);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("Invalid login");
    });
  });
});
