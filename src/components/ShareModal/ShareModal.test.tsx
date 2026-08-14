/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ShareModal from "./ShareModal";

vi.mock("../../lib/share", () => ({
  createShare: vi.fn(),
  fetchSharesForCandidature: vi.fn(),
  isShareActive: vi.fn((share) => !share.revokedAt),
  revokeShare: vi.fn(),
}));

import { createShare, fetchSharesForCandidature } from "../../lib/share";

const candidature = {
  id: "c1",
  entreprise: "Alpha Corp",
  poste: "Frontend Dev",
  statut: "cv_envoye" as const,
};

describe("ShareModal", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchSharesForCandidature).mockResolvedValue([]);
    vi.mocked(createShare).mockResolvedValue({
      id: "s1",
      token: "share-token",
      expiresAt: null,
      createdAt: "2026-01-01",
    });
  });

  it("creates share link when form is submitted", async () => {
    render(
      <ShareModal
        isOpen
        onClose={vi.fn()}
        candidature={candidature as never}
        userId="u1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Partager la candidature" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Créer le lien" }));

    await waitFor(() => {
      expect(createShare).toHaveBeenCalledWith("u1", candidature, "7d", "");
    });
  });
});
