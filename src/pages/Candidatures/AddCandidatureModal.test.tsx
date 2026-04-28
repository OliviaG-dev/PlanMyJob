/* @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import AddCandidatureModal from "./AddCandidatureModal";

describe("AddCandidatureModal", () => {
  afterEach(() => {
    cleanup();
  });

  it("auto-detects source from link and locks source field in add mode", () => {
    render(
      <AddCandidatureModal
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("https://..."), {
      target: { value: "https://www.linkedin.com/jobs/view/123" },
    });

    expect(
      screen.getByText(/Source détectée automatiquement : LinkedIn/i),
    ).toBeTruthy();
    expect(screen.getByLabelText("Source détectée automatiquement")).toBeTruthy();
  });

  it("adds and removes a competence badge", () => {
    render(
      <AddCandidatureModal
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.change(screen.getAllByLabelText("Ajouter une compétence")[0], {
      target: { value: "react" },
    });
    expect(screen.getByLabelText("Retirer react")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Retirer react"));
    expect(screen.queryByLabelText("Retirer react")).toBeNull();
  });

  it("submits form data", () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <AddCandidatureModal
        isOpen
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getAllByPlaceholderText("Nom de l'entreprise")[0], {
      target: { value: "ACME" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("Intitulé du poste")[0], {
      target: { value: "Dev Front" },
    });
    const form = container.querySelector("form");
    if (!form) throw new Error("Form not found");
    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ entreprise: "ACME", poste: "Dev Front" }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps source select editable when link source is unknown", () => {
    render(
      <AddCandidatureModal
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.change(screen.getAllByPlaceholderText("https://...")[0], {
      target: { value: "https://example.com/job" },
    });

    expect(screen.queryByLabelText("Source détectée automatiquement")).toBeNull();
    expect(screen.getByRole("button", { name: "Source" })).toBeTruthy();
  });

  it("prefills values in edit mode and submits edit label", () => {
    const onSubmit = vi.fn();
    render(
      <AddCandidatureModal
        isOpen
        mode="edit"
        initialData={{
          entreprise: "Init Co",
          poste: "Init Dev",
          lienOffre: "https://example.com/job",
          localisation: "Lyon",
          typeContrat: "cdi",
          teletravail: "hybride",
          dateCandidature: "2026-04-28",
          source: "autre",
          notePersonnelle: 4,
          statutSuivi: "en_cours",
          statut: "a_postuler",
          salaireOuFourchette: "",
          notes: "",
          competences: "react",
        }}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByDisplayValue("Init Co")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("calls onClose when clicking overlay", () => {
    const onClose = vi.fn();
    render(
      <AddCandidatureModal
        isOpen
        onClose={onClose}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalled();
  });
});
