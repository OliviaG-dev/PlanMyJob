/* @vitest-environment jsdom */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useJobSites } from "./useJobSites";

vi.mock("../lib/jobSites", () => ({
  fetchJobSites: vi.fn(),
  fetchUserJobSiteStatus: vi.fn(),
  upsertUserJobSiteStatus: vi.fn(),
  insertJobSite: vi.fn(),
  deleteJobSite: vi.fn(),
}));

import {
  deleteJobSite,
  fetchJobSites,
  fetchUserJobSiteStatus,
  insertJobSite,
  upsertUserJobSiteStatus,
} from "../lib/jobSites";

describe("useJobSites", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("loads sites and syncs checkbox state", async () => {
    vi.mocked(fetchJobSites).mockResolvedValue([
      { id: "site1", label: "LinkedIn", url: "https://linkedin.com", position: 0 },
    ] as never);
    vi.mocked(fetchUserJobSiteStatus).mockResolvedValue([
      { jobSiteId: "site1", accountCreated: true, cvSent: false },
    ] as never);

    const { result } = renderHook(() => useJobSites("u1"));

    await waitFor(() => {
      expect(result.current.loadingSites).toBe(false);
    });

    expect(result.current.jobSites).toHaveLength(1);
    expect(result.current.siteCheckboxes.site1).toEqual({
      created: true,
      cvSent: false,
    });
  });

  it("updates checkbox and persists to backend", async () => {
    vi.mocked(fetchJobSites).mockResolvedValue([
      { id: "site1", label: "LinkedIn", url: "https://linkedin.com", position: 0 },
    ] as never);
    vi.mocked(fetchUserJobSiteStatus).mockResolvedValue([]);
    vi.mocked(upsertUserJobSiteStatus).mockResolvedValue(undefined);

    const { result } = renderHook(() => useJobSites("u1"));

    await waitFor(() => {
      expect(result.current.loadingSites).toBe(false);
    });

    act(() => {
      result.current.setSiteCheckbox("site1", "cvSent", true);
    });

    expect(result.current.siteCheckboxes.site1.cvSent).toBe(true);
    await waitFor(() => {
      expect(upsertUserJobSiteStatus).toHaveBeenCalledWith("u1", "site1", {
        accountCreated: false,
        cvSent: true,
      });
    });
  });

  it("adds and removes custom sites", async () => {
    vi.mocked(fetchJobSites).mockResolvedValue([]);
    vi.mocked(fetchUserJobSiteStatus).mockResolvedValue([]);
    vi.mocked(insertJobSite).mockResolvedValue({
      id: "site2",
      label: "Custom",
      url: "https://custom.jobs",
      position: 1,
    } as never);
    vi.mocked(deleteJobSite).mockResolvedValue(undefined);

    const { result } = renderHook(() => useJobSites("u1"));

    await waitFor(() => {
      expect(result.current.loadingSites).toBe(false);
    });

    await act(async () => {
      const ok = await result.current.addSite("Custom", "https://custom.jobs");
      expect(ok).toBe(true);
    });
    expect(result.current.jobSites).toHaveLength(1);

    await act(async () => {
      const ok = await result.current.removeSite("site2");
      expect(ok).toBe(true);
    });
    expect(result.current.jobSites).toHaveLength(0);
  });
});
