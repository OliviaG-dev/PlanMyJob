/* @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardActiveShares from "./DashboardActiveShares";

vi.mock("../../hooks/useActiveShares", () => ({
  useActiveShares: vi.fn(),
}));

vi.mock("../../lib/share", () => ({
  revokeShare: vi.fn(),
}));

import { useActiveShares } from "../../hooks/useActiveShares";

describe("DashboardActiveShares", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.mocked(useActiveShares).mockReturnValue({
      shares: [
        {
          id: "s1",
          token: "tok",
          expiresAt: null,
          revokedAt: null,
          createdAt: "2026-08-01",
          candidatureId: "c1",
          entreprise: "Alpha Corp",
          poste: "Frontend Dev",
        },
      ],
      loading: false,
      error: null,
      reload: vi.fn(),
    });
  });

  it("lists active share links", async () => {
    render(<DashboardActiveShares userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Alpha Corp")).toBeTruthy();
    });
    expect(screen.getByText("Frontend Dev")).toBeTruthy();
  });
});
