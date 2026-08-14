/* @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublicShare from "./PublicShare";

vi.mock("../../lib/share", () => ({
  fetchPublicShare: vi.fn(),
}));

vi.mock("../../components/ShareQrCode/ShareQrCode", () => ({
  default: () => <div data-testid="qr-code" />,
}));

import { fetchPublicShare } from "../../lib/share";

const shareData = {
  entreprise: "Alpha Corp",
  poste: "Frontend Dev",
  statut: "cv_envoye" as const,
  statutLabel: "CV envoyé",
  cvEnvoye: true,
  timeline: [],
  snapshotAt: "2026-04-28T00:00:00.000Z",
  sharedAt: "2026-04-28T00:00:00.000Z",
};

function renderPublicShare(token = "abc123") {
  return render(
    <MemoryRouter initialEntries={[`/share/${token}`]}>
      <Routes>
        <Route path="/share/:token" element={<PublicShare />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicShare", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows error when share is expired", async () => {
    vi.mocked(fetchPublicShare).mockResolvedValue({
      ok: false,
      reason: "expired",
    } as never);

    renderPublicShare();

    await waitFor(() => {
      expect(screen.getByText(/a expiré/i)).toBeTruthy();
    });
  });

  it("renders share content when ready", async () => {
    vi.mocked(fetchPublicShare).mockResolvedValue({
      ok: true,
      data: shareData,
    } as never);

    renderPublicShare();

    await waitFor(() => {
      expect(screen.getByText("Alpha Corp")).toBeTruthy();
    });
    expect(screen.getByText("Frontend Dev")).toBeTruthy();
  });
});
