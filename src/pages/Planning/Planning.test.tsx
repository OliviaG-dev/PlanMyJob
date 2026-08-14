/* @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Planning from "./Planning";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../lib/candidatures", () => ({
  fetchCandidatures: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";
import { fetchCandidatures } from "../../lib/candidatures";

describe("Planning", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "u1" },
      loading: false,
    } as never);
    vi.mocked(fetchCandidatures).mockResolvedValue([
      {
        id: "c1",
        entreprise: "Alpha",
        poste: "Dev",
        statut: "cv_envoye",
        dateCandidature: "2026-08-10",
        cvEnvoyeAt: "2026-08-10T10:00:00.000Z",
      },
    ] as never);
  });

  it("renders planning calendar after loading candidatures", async () => {
    render(
      <MemoryRouter>
        <Planning />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Semainier / Planning" })).toBeTruthy();
    });
  });
});
