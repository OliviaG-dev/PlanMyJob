import { describe, expect, it, vi, afterEach } from "vitest";
import type { Candidature } from "../types/candidature";
import {
  buildMonthlyReportSnapshot,
  computeMonthlyStats,
  filterCandidaturesInMonth,
  getStatutAtDate,
  groupCandidaturesByWeek,
  isInProgressForMonth,
} from "./monthlyReportSnapshot";
import { getMonthBounds } from "./dateWeek";

function baseCandidature(overrides: Partial<Candidature> = {}): Candidature {
  return {
    id: "c1",
    entreprise: "Dougs Compta",
    poste: "Software Engineer Fullstack",
    statut: "cv_envoye",
    dateCandidature: "2026-08-11",
    localisation: "Bron",
    source: "linkedin",
    typeContrat: "cdi",
    cvEnvoyeAt: "2026-08-11T10:00:00.000Z",
    ...overrides,
  };
}

describe("monthlyReportSnapshot", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("filterCandidaturesInMonth includes candidatures by dateCandidature", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-13T12:00:00.000Z"));

    const inMonth = baseCandidature({ id: "a", dateCandidature: "2026-08-11" });
    const outMonth = baseCandidature({ id: "b", dateCandidature: "2026-07-30" });

    const result = filterCandidaturesInMonth([inMonth, outMonth], 2026, 7);
    expect(result.map((c) => c.id)).toEqual(["a"]);
  });

  it("getMonthBounds is partial for current month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-13T12:00:00.000Z"));

    const bounds = getMonthBounds(2026, 7);
    expect(bounds.isPartial).toBe(true);
    expect(bounds.partialUntil).toBe("2026-08-13");
  });

  it("counts interviews by entretienRhAt in month even if statut is refus later", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00.000Z"));

    const c = baseCandidature({
      statut: "refus",
      entretienRhAt: "2026-08-16T14:00:00.000Z",
      refusAt: "2026-09-01T10:00:00.000Z",
    });

    const stats = computeMonthlyStats([c], 2026, 7, new Date("2026-09-15"));
    expect(stats.entretiens).toBe(1);
  });

  it("getStatutAtDate applies 15-day sans_reponse rule at end of month", () => {
    const c = baseCandidature({
      statut: "cv_envoye",
      cvEnvoyeAt: "2026-08-01T10:00:00.000Z",
    });
    const endAugust = new Date("2026-08-31T23:59:59.999Z");
    expect(getStatutAtDate(c, endAugust)).toBe("sans_reponse");
  });

  it("isInProgressForMonth uses current progress for partial month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-13T12:00:00.000Z"));

    const enCours = baseCandidature({ statut: "cv_envoye" });
    const terminee = baseCandidature({
      id: "c2",
      statut: "refus",
      refusAt: "2026-08-12T10:00:00.000Z",
    });

    expect(isInProgressForMonth(enCours, 2026, 7)).toBe(true);
    expect(isInProgressForMonth(terminee, 2026, 7)).toBe(false);
  });

  it("isInProgressForMonth reconstructs state at end of past month", () => {
    const stillActive = baseCandidature({
      statut: "entretien_rh",
      entretienRhAt: "2026-08-20T10:00:00.000Z",
    });
    const refusedLater = baseCandidature({
      id: "c2",
      statut: "refus",
      entretienRhAt: "2026-08-10T10:00:00.000Z",
      refusAt: "2026-09-05T10:00:00.000Z",
    });

    expect(isInProgressForMonth(stillActive, 2026, 7, new Date(2026, 8, 1))).toBe(
      true
    );
    expect(isInProgressForMonth(refusedLater, 2026, 7, new Date(2026, 8, 1))).toBe(
      true
    );
  });

  it("groupCandidaturesByWeek includes all weeks of the month with ordinals", () => {
    const c = baseCandidature({ dateCandidature: "2026-08-11" });
    const weeks = groupCandidaturesByWeek([c], 2026, 7);
    expect(weeks.length).toBeGreaterThan(1);

    const weekWithCandidature = weeks.find((w) => w.candidatures.length > 0);
    expect(weekWithCandidature?.weekStart).toBe("2026-08-10");
    expect(weekWithCandidature?.weekLabel).toMatch(/semaine ·/);
    expect(weekWithCandidature?.candidatures[0].entreprise).toBe("Dougs Compta");

    const emptyWeek = weeks.find((w) => w.candidatures.length === 0);
    expect(emptyWeek).toBeDefined();
  });

  it("buildMonthlyReportSnapshot sets isPartial and stats", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-13T12:00:00.000Z"));

    const snapshot = buildMonthlyReportSnapshot([baseCandidature()], 2026, 7);
    expect(snapshot.isPartial).toBe(true);
    expect(snapshot.monthLabel).toBe("Août 2026");
    expect(snapshot.stats.candidaturesEnvoyees).toBe(1);
    const weekWithData = snapshot.weeks.filter((w) => w.candidatures.length > 0);
    expect(weekWithData).toHaveLength(1);
    expect(snapshot.weeks.length).toBeGreaterThan(weekWithData.length);
  });
});
