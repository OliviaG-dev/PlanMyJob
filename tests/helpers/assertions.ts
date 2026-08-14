import { expect } from "vitest";
import { within } from "@testing-library/react";
import type { ExtractedOffer } from "../../src/lib/offerAnalyzer";

export function expectOfferCoreFields(
  offer: ExtractedOffer,
  expected: Pick<
    ExtractedOffer,
    "poste" | "entreprise" | "localisation" | "source"
  >,
): void {
  expect(offer.poste).toBe(expected.poste);
  expect(offer.entreprise).toBe(expected.entreprise);
  expect(offer.localisation).toBe(expected.localisation);
  expect(offer.source).toBe(expected.source);
}

export function expectCandidatureInKanbanColumn(
  screen: Pick<
    typeof import("@testing-library/react").screen,
    "getAllByRole"
  >,
  columnLabel: string,
  entreprise: string,
): void {
  const columnHeading = screen
    .getAllByRole("heading")
    .find((heading) => heading.textContent?.includes(columnLabel));
  expect(columnHeading).toBeTruthy();
  const column = columnHeading?.closest(".kanban__column");
  expect(column).toBeTruthy();
  expect(within(column as HTMLElement).getByText(entreprise)).toBeTruthy();
}
