/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Signup from "./Signup";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";

describe("Signup", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      signUp: vi.fn().mockResolvedValue({ error: null }),
    } as never);
  });

  it("validates password confirmation", () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Mot de passe/), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText("Confirmer le mot de passe"), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "S'inscrire" }));

    expect(screen.getByRole("alert").textContent).toContain(
      "Les mots de passe ne correspondent pas.",
    );
  });
});
