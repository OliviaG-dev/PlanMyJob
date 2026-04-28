import { expect } from "vitest";
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
