/* @vitest-environment jsdom */
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useActiveShares } from "./useActiveShares";

vi.mock("../lib/share", () => ({
  fetchActiveSharesForUser: vi.fn(),
}));

import { fetchActiveSharesForUser } from "../lib/share";

describe("useActiveShares", () => {
  it("clears shares when userId is missing", async () => {
    const { result } = renderHook(() => useActiveShares(undefined));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.shares).toEqual([]);
    expect(fetchActiveSharesForUser).not.toHaveBeenCalled();
  });

  it("loads active shares for user", async () => {
    vi.mocked(fetchActiveSharesForUser).mockResolvedValue([
      {
        id: "s1",
        token: "tok",
        expiresAt: null,
        revokedAt: null,
        createdAt: "2026-01-01",
        candidatureId: "c1",
        entreprise: "Alpha",
        poste: "Dev",
      },
    ]);

    const { result } = renderHook(() => useActiveShares("u1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.shares).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });
});
