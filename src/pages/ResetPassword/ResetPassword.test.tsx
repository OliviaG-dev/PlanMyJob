/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ResetPassword from "./ResetPassword";

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

vi.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

import { useAuth } from "../../contexts/AuthContext";

describe("ResetPassword", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "u1" },
      loading: false,
    } as never);
    window.location.hash = "#access_token=test";
  });

  it("validates password confirmation", () => {
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/^Nouveau mot de passe/), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText("Confirmer le mot de passe"), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer le mot de passe" }));

    expect(screen.getByRole("alert").textContent).toContain(
      "Les deux mots de passe ne correspondent pas.",
    );
  });
});
