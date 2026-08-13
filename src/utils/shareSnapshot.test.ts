import { describe, expect, it } from "vitest";
import type { Candidature } from "../types/candidature";
import {
  buildPublicShareSnapshot,
  buildShareTimeline,
  computeExpiresAt,
  formatShareDateNumeric,
  formatShareExpiryNumeric,
  isCvEnvoye,
} from "./shareSnapshot";

function baseCandidature(overrides: Partial<Candidature> = {}): Candidature {
  return {
    id: "c1",
    entreprise: "Ubisoft",
    poste: "Développeur Fullstack",
    statut: "attente_reponse",
    dateCandidature: "2026-08-13",
    localisation: "Paris",
    source: "linkedin",
    typeContrat: "cdi",
    cvEnvoyeAt: "2026-08-13T10:00:00.000Z",
    entretienRhAt: "2026-08-16T14:00:00.000Z",
    attenteReponseAt: "2026-08-21T09:00:00.000Z",
    ...overrides,
  };
}

describe("shareSnapshot utils", () => {
  it("computeExpiresAt returns null for never", () => {
    expect(computeExpiresAt("never")).toBeNull();
  });

  it("computeExpiresAt returns future date for 24h", () => {
    const before = Date.now();
    const expires = computeExpiresAt("24h");
    expect(expires).not.toBeNull();
    const diff = new Date(expires!).getTime() - before;
    expect(diff).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(25 * 60 * 60 * 1000);
  });

  it("isCvEnvoye is true when statut is not a_postuler", () => {
    expect(isCvEnvoye(baseCandidature({ statut: "cv_envoye" }))).toBe(true);
    expect(
      isCvEnvoye(
        baseCandidature({ statut: "a_postuler", cvEnvoyeAt: undefined })
      )
    ).toBe(false);
  });

  it("buildShareTimeline orders events chronologically", () => {
    const timeline = buildShareTimeline(baseCandidature());
    expect(timeline.map((e) => e.label)).toEqual([
      "Candidature enregistrée",
      "CV envoyé",
      "Entretien RH",
      "En attente de réponse",
    ]);
  });

  it("formatShareDateNumeric uses jj/mm/aaaa", () => {
    expect(formatShareDateNumeric("2026-08-13T10:00:00.000Z")).toMatch(
      /^13\/08\/2026$/
    );
  });

  it("formatShareExpiryNumeric uses numeric date", () => {
    expect(formatShareExpiryNumeric("2026-08-20T00:00:00.000Z")).toBe(
      "Expire le 20/08/2026"
    );
  });

  it("buildPublicShareSnapshot excludes private fields", () => {
    const snapshot = buildPublicShareSnapshot(
      baseCandidature({
        notes: "Note privée",
        notePersonnelle: 5,
        salaireOuFourchette: "50k",
      })
    );

    expect(snapshot.entreprise).toBe("Ubisoft");
    expect(snapshot.cvEnvoye).toBe(true);
    expect(snapshot.statutLabel).toBe("Attente de réponse");
    expect(snapshot).not.toHaveProperty("notes");
    expect(snapshot).not.toHaveProperty("notePersonnelle");
    expect(snapshot).not.toHaveProperty("salaireOuFourchette");
  });
});
