/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Analyse from "./Analyse";

import { HELLOWORK_BASIC_OFFER_FIXTURE } from "../../lib/testFixtures";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("Analyse", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts offer and navigates to candidatures with cv_envoye", async () => {
    render(
      <MemoryRouter>
        <Analyse />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: HELLOWORK_BASIC_OFFER_FIXTURE },
    });
    fireEvent.click(screen.getByRole("button", { name: "Extraire les informations" }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("Activus Group")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Créer une candidature" }));

    expect(navigateMock).toHaveBeenCalledWith(
      "/candidatures",
      expect.objectContaining({
        state: expect.objectContaining({
          addWithInitialData: expect.objectContaining({ statut: "cv_envoye" }),
        }),
      }),
    );
  });
});
