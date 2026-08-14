/* @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OutilsPostulations from "./OutilsPostulations";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../hooks/useCvResources", () => ({
  useCvResources: vi.fn(),
}));

vi.mock("../../hooks/useJobSites", () => ({
  useJobSites: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";
import { useCvResources } from "../../hooks/useCvResources";
import { useJobSites } from "../../hooks/useJobSites";

describe("OutilsPostulations", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "u1" },
      loading: false,
    } as never);
    vi.mocked(useCvResources).mockReturnValue({
      cvs: [],
      loading: false,
      error: null,
      addCv: vi.fn(),
      removeCv: vi.fn(),
    });
    vi.mocked(useJobSites).mockReturnValue({
      jobSites: [],
      loadingSites: false,
      siteCheckboxes: {},
      sitesError: null,
      setSiteCheckbox: vi.fn(),
      addSite: vi.fn(),
      removeSite: vi.fn(),
    });
  });

  it("renders outils page sections", async () => {
    render(
      <MemoryRouter>
        <OutilsPostulations />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Ressources" })).toBeTruthy();
    });
  });
});
