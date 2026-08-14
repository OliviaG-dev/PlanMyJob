/* @vitest-environment jsdom */
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCvResources } from "./useCvResources";

vi.mock("../lib/cvRessources", () => ({
  fetchCvRessources: vi.fn(),
  insertCvRessource: vi.fn(),
  deleteCvRessource: vi.fn(),
}));

import {
  deleteCvRessource,
  fetchCvRessources,
  insertCvRessource,
} from "../lib/cvRessources";

describe("useCvResources", () => {
  it("loads CV resources", async () => {
    vi.mocked(fetchCvRessources).mockResolvedValue([
      {
        id: "cv1",
        titre: "CV principal",
        type: "general",
        format: "pdf",
        url: "https://example.com/cv.pdf",
        createdAt: "2026-01-01",
      },
    ] as never);

    const { result } = renderHook(() => useCvResources("u1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.cvs).toHaveLength(1);
  });

  it("adds and removes CV", async () => {
    vi.mocked(fetchCvRessources).mockResolvedValue([]);
    vi.mocked(insertCvRessource).mockResolvedValue({
      id: "cv2",
      titre: "CV tech",
      type: "technique",
      format: "pdf",
      url: "https://example.com/cv-tech.pdf",
      createdAt: "2026-01-02",
    } as never);

    const { result } = renderHook(() => useCvResources("u1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const ok = await result.current.addCv({
        titre: "CV tech",
        type: "tech",
        url: "https://example.com/cv-tech.pdf",
      });
      expect(ok).toBe(true);
    });
    expect(result.current.cvs).toHaveLength(1);

    await act(async () => {
      const ok = await result.current.removeCv("cv2");
      expect(ok).toBe(true);
    });
    expect(deleteCvRessource).toHaveBeenCalledWith("u1", "cv2");
  });
});
