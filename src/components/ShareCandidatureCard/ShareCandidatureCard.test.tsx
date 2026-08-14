/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ShareCandidatureCard from "./ShareCandidatureCard";

const snapshot = {
  entreprise: "Activus Group",
  poste: "Développeur Full Stack",
  localisation: "Toulouse",
  dateCandidature: "2026-04-28",
  statut: "cv_envoye" as const,
  statutLabel: "CV envoyé",
  cvEnvoye: true,
  sourceLabel: "HelloWork",
  typeContratLabel: "CDI",
  timeline: [],
  snapshotAt: "2026-04-28T00:00:00.000Z",
};

describe("ShareCandidatureCard", () => {
  afterEach(() => cleanup());

  it("renders full card with details", () => {
    render(<ShareCandidatureCard data={snapshot} />);
    expect(screen.getByText("Activus Group")).toBeTruthy();
    expect(screen.getByText("Développeur Full Stack")).toBeTruthy();
    expect(screen.getByText("CV envoyé")).toBeTruthy();
  });

  it("toggles compact card details", () => {
    render(<ShareCandidatureCard data={snapshot} compact />);
    fireEvent.click(screen.getByRole("button", { name: /Voir les détails/i }));
    expect(screen.getByText("Toulouse")).toBeTruthy();
  });
});
