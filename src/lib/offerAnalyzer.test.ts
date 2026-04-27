import { describe, expect, it } from "vitest";
import {
  extractOfferFromText,
  extractedToFormData,
  inferSourceFromUrl,
} from "./offerAnalyzer";

describe("offerAnalyzer", () => {
  it("extracts key fields from a HelloWork-style offer", () => {
    const raw = `Développeur Full Stack H/F
Activus Group
Toulouse - 31
CDI
40 000 - 45 000 € / an
Télétravail partiel
Exp. 3 ans min.
https://www.hellowork.com/fr-fr/emplois/78135157.html`;

    const result = extractOfferFromText(raw);

    expect(result.localisation).toBe("Toulouse - 31");
    expect(result.experienceYears.toLowerCase()).toContain("3 ans");
    expect(result.salaireOuFourchette).toContain("40");
    expect(result.salaireOuFourchette).toContain("45");
    expect(result.source).toBe("hellowork");
  });

  it("extracts key fields from a France Travail-style offer", () => {
    const raw = `Offre n° 207MTVY
Développeur(euse) Mobile Fullstack (React Native) H/F
19 - BRIVE LA GAILLARDE - Localiser avec Mappy
Type de contrat
CDD - 3 Mois
Salaire
Salaire brut : Mensuel de 3700.00 Euros à 4500.00 Euros sur 12 mois
Expérience
Débutant accepté`;

    const result = extractOfferFromText(raw);

    expect(result.localisation).toContain("19 - BRIVE LA GAILLARDE");
    expect(result.experienceYears.toLowerCase()).toContain("débutant");
    expect(result.experienceYears.toLowerCase()).toContain("accept");
    expect(result.salaireOuFourchette.toLowerCase()).toContain("mensuel de 3700.00 euros");
    expect(result.salaireOuFourchette.toLowerCase()).toContain("4500.00 euros");
  });

  it("detects source from imperfect links", () => {
    expect(inferSourceFromUrl("www.hellowork.com/fr-fr/emplois/78135157.html")).toBe("hellowork");
    expect(inferSourceFromUrl("https://www.linkedin.com/jobs/view/123")).toBe("linkedin");
  });

  it("extracts localisation with city and department in parentheses", () => {
    const raw = `Développeur Front-End
Entreprise X
Lyon (69)
CDI`;

    const result = extractOfferFromText(raw);
    expect(result.localisation).toBe("Lyon (69)");
  });

  it("extracts salary ranges expressed in k euros", () => {
    const raw = `Salaire proposé : 45 k€ - 55 k€ annuel`;

    const result = extractOfferFromText(raw);
    expect(result.salaireOuFourchette.toLowerCase()).toContain("45");
    expect(result.salaireOuFourchette.toLowerCase()).toContain("55");
    expect(result.salaireOuFourchette.toLowerCase()).toContain("k");
  });

  it("extracts experience from Exp. 5 ans min format", () => {
    const raw = `Exp. 5 ans min.`;

    const result = extractOfferFromText(raw);
    expect(result.experienceYears.toLowerCase()).toContain("5 ans");
    expect(result.experienceYears.toLowerCase()).toContain("min");
  });

  it("uses text fallback for source detection when no URL is present", () => {
    const raw = `Postulez sur LinkedIn pour ce poste de Développeur Front-End`;

    const result = extractOfferFromText(raw);
    expect(result.lienCandidature).toBe("");
    expect(result.source).toBe("linkedin");
  });

  it("filters rating-like lines and stops avantages at next section", () => {
    const raw = `Avantages
- Mutuelle
4.2
Description
- Cette ligne ne doit pas être prise dans les avantages`;

    const result = extractOfferFromText(raw);
    expect(result.pointsCles).toContain("Mutuelle");
    expect(result.pointsCles).not.toContain("4.2");
  });

  it("maps extracted offer to candidature form data", () => {
    const extracted = extractOfferFromText(
      `Développeur Front-End
ACME
Lyon (69)
CDI
https://www.hellowork.com/fr-fr/emplois/123.html`,
    );

    const formData = extractedToFormData(extracted);
    expect(formData.entreprise).toBe(extracted.entreprise);
    expect(formData.poste).toBe(extracted.poste);
    expect(formData.lienOffre).toBe(extracted.lienCandidature);
    expect(formData.source).toBe("hellowork");
    expect(formData.statutSuivi).toBe("en_cours");
    expect(formData.statut).toBe("a_postuler");
  });

  it("extracts localisation from dept-city format and strips localiser suffix", () => {
    const raw = `Offre
19 - BRIVE LA GAILLARDE - Localiser avec Mappy`;

    const result = extractOfferFromText(raw);
    expect(result.localisation).toBe("19 - BRIVE LA GAILLARDE");
  });

  it("extracts localisation from city(dept) substring in a longer line", () => {
    const raw = `Localisation : Lyon (69)`;

    const result = extractOfferFromText(raw);
    expect(result.localisation).toBe("Lyon (69)");
  });

  it("extracts localisation from city-dept substring in a longer line", () => {
    const raw = `Ville : Toulouse - 31`;

    const result = extractOfferFromText(raw);
    expect(result.localisation).toBe("Toulouse - 31");
  });

  it("extracts localisation from dept-city substring in a longer line", () => {
    const raw = `Adresse du poste : 19 - BRIVE LA GAILLARDE - Localiser avec Mappy`;

    const result = extractOfferFromText(raw);
    expect(result.localisation).toBe("19 - BRIVE LA GAILLARDE");
  });

  it("captures secteur key point and ignores overly long secteur values", () => {
    const withSector = extractOfferFromText(
      `Secteur d'activité : Programmation informatique`,
    );
    expect(withSector.pointsCles).toContain(
      "Secteur : Programmation informatique",
    );

    const tooLongSector = `Secteur d'activité : ${"x".repeat(180)}`;
    const withTooLongSector = extractOfferFromText(tooLongSector);
    expect(
      withTooLongSector.pointsCles.some((p) => p.startsWith("Secteur : ")),
    ).toBe(false);
  });

  it("stops avantages extraction when next section header starts", () => {
    const raw = `Avantages
- Mutuelle
- Prime transport
- Tickets resto
- Horaires flexibles
- Budget formation
- Télétravail partiel
- RTT
- Team building
- CSE
Description :
- Ce point ne doit pas apparaître`;

    const result = extractOfferFromText(raw);
    expect(result.pointsCles).toContain("Mutuelle");
    expect(result.pointsCles).toContain("CSE");
    expect(result.pointsCles).not.toContain(
      "Ce point ne doit pas apparaître",
    );
  });
});
