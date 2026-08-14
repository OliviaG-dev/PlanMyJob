/* @vitest-environment jsdom */
import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useCandidaturesBoard } from "./useCandidaturesBoard";

vi.mock("../lib/candidatures", () => ({
  fetchCandidatures: vi.fn(),
  insertCandidature: vi.fn(),
  updateCandidature: vi.fn(),
}));

import { fetchCandidatures } from "../lib/candidatures";

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe("useCandidaturesBoard", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });
  it("loads candidatures for user", async () => {
    vi.mocked(fetchCandidatures).mockResolvedValue([
      {
        id: "c1",
        entreprise: "Alpha",
        poste: "Dev",
        statut: "cv_envoye",
        statutSuivi: "en_cours",
      },
    ] as never);

    const { result } = renderHook(() => useCandidaturesBoard("u1"), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.candidatures).toHaveLength(1);
  });

  it("clears data when user is missing", async () => {
    const { result } = renderHook(() => useCandidaturesBoard(undefined), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.candidatures).toEqual([]);
  });
});
