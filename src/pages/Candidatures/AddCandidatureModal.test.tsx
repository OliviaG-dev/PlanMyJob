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
});
