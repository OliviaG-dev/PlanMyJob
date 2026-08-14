/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ForgotPassword from "./ForgotPassword";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";

describe("ForgotPassword", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      sendPasswordResetEmail: vi.fn().mockResolvedValue({ error: null }),
    } as never);
  });

  it("shows success message after submit", async () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer le lien" }));

    await waitFor(() => {
      expect(screen.getByText(/lien de réinitialisation/i)).toBeTruthy();
    });
  });
});
