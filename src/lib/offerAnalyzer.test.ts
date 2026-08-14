import { describe, expect, it } from "vitest";
import {
  extractOfferFromText,
  extractedToFormData,
  inferSourceFromUrl,
} from "./offerAnalyzer";
import {
  FRANCE_TRAVAIL_CDD_OFFER_FIXTURE,
  HELLOWORK_BASIC_OFFER_FIXTURE,
  INDEED_BASIC_OFFER_FIXTURE,
  LINKEDIN_FULLSTACK_OFFER_FIXTURE,
} from "./testFixtures.ts";

describe("offerAnalyzer", () => {
  it("extracts key fields from a HelloWork-style offer", () => {
    const raw = HELLOWORK_BASIC_OFFER_FIXTURE;

    const result = extractOfferFromText(raw);

    expect(result.localisation).toBe("Toulouse - 31");
    expect(result.experienceYears.toLowerCase()).toContain("3 ans");
    expect(result.salaireOuFourchette).toContain("40");
    expect(result.salaireOuFourchette).toContain("45");
    expect(result.source).toBe("hellowork");
  });

  it("extracts key fields from a France Travail-style offer", () => {
    const raw = FRANCE_TRAVAIL_CDD_OFFER_FIXTURE;

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
    expect(inferSourceFromUrl("https://fr.indeed.com/viewjob?jk=abc123")).toBe("indeed");
    expect(inferSourceFromUrl("smartapply.indeed.com/beta/abc/applied")).toBe("indeed");
  });

  it("extracts key fields from an Indeed-style offer", () => {
    const result = extractOfferFromText(INDEED_BASIC_OFFER_FIXTURE);

    expect(result.poste).toBe("Développeur Java Senior H/F");
    expect(result.entreprise).toBe("TechCorp Solutions");
    expect(result.localisation).toBe("Lyon (69)");
    expect(result.typeContrat).toBe("cdi");
    expect(result.teletravail).toBe("hybride");
    expect(result.experienceYears.toLowerCase()).toContain("5 ans");
    expect(result.salaireOuFourchette).toContain("45");
    expect(result.salaireOuFourchette).toContain("52");
    expect(result.lienCandidature).toContain("fr.indeed.com");
    expect(result.source).toBe("indeed");
    expect(result.competences).toContain("java");
  });

  it("uses text fallback for Indeed source when no URL is present", () => {
    const raw = `Postulez sur Indeed pour ce poste de Développeur Backend Node.js`;

    const result = extractOfferFromText(raw);
    expect(result.lienCandidature).toBe("");
    expect(result.source).toBe("indeed");
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
    expect(formData.statut).toBe("cv_envoye");
  });

  it("extracts localisation from dept-city format and strips localiser suffix", () => {
    const raw = `Offre
19 - BRIVE LA GAILLARDE - Localiser avec Mappy`;

    const result = extractOfferFromText(raw);
    expect(result.localisation).toBe("19 - BRIVE LA GAILLARDE");
  });

  it("extracts company from employeur section in France Travail offers", () => {
    const raw = `Offre n° 999XXXX
Développeur Fullstack H/F
19 - BRIVE LA GAILLARDE - Localiser avec Mappy
Type de contrat
CDI
Employeur
ACME DIGITAL`;

    const result = extractOfferFromText(raw);
    expect(result.entreprise).toBe("ACME DIGITAL");
    expect(result.localisation).toBe("19 - BRIVE LA GAILLARDE");
  });

  it("does not extract offer number as salary in France Travail offers", () => {
    const raw = `Offre n° 2071234AB
Développeur Front-End H/F
69 - LYON - Localiser avec Mappy
Type de contrat
CDI
Employeur
ACME DIGITAL`;

    const result = extractOfferFromText(raw);
    expect(result.salaireOuFourchette).toBe("");
  });

  it("does not keep full recruitment sentence as poste", () => {
    const raw = `Nous recherchons actuellement un développeur front-end (F/H) qui effectuera les missions suivantes :
Type de contrat
CDI`;

    const result = extractOfferFromText(raw);
    expect(result.poste.toLowerCase()).not.toContain("nous recherchons");
    expect(result.poste.toLowerCase()).not.toContain("missions suivantes");
    expect(result.poste.toLowerCase()).toContain("développeur front-end");
  });

  it("extracts company and cachet salary from France Travail narrative format", () => {
    const raw = `Offre n° 3758823
Développeur Front Angular (H/F)
69 - Lyon

Klanik recherche actuellement un Développeur Frontend Angular pour travailler sur un projet à Lyon.
Salaire
Salaire brut : Cachet de 45000.0 Euros à 50000.0 Euros
Employeur
Depuis sa création, KLANIK s'est donnée pour mission de conjuguer expertise technologique et authenticité.`;

    const result = extractOfferFromText(raw);
    expect(result.poste).toBe("Développeur Front Angular (H/F)");
    expect(result.entreprise).toBe("Klanik");
    expect(result.salaireOuFourchette.toLowerCase()).toContain("cachet de 45000.0 euros");
    expect(result.salaireOuFourchette.toLowerCase()).toContain("50000.0 euros");
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

  it("extracts key fields from a LinkedIn-style offer paste", () => {
    const result = extractOfferFromText(LINKEDIN_FULLSTACK_OFFER_FIXTURE);

    expect(result.poste).toBe(
      "Software engineer fullstack typescript - Cybersécurité",
    );
    expect(result.entreprise).toBe("LITY");
    expect(result.localisation).toBe(
      "Ville de Paris, Île-de-France, France",
    );
    expect(result.typeContrat).toBe("cdi");
    expect(result.teletravail).toBe("hybride");
    expect(result.source).toBe("linkedin");
    expect(result.salaireOuFourchette.toLowerCase()).toContain("80k");
    expect(result.competences).toContain("react");
    expect(result.competences).toContain("typescript");
    expect(result.competences).not.toContain("IA");
    expect(result.pointsCles).not.toContain("Logo de l'entreprise, LITY.");
    expect(result.pointsCles).not.toContain("LITY");
  });

  it("defaults contract type to cdi when no explicit contract and no daily rate", () => {
    const raw = `Développeur Front-End
ACME
Lyon (69)
Télétravail partiel`;

    const result = extractOfferFromText(raw);
    expect(result.typeContrat).toBe("cdi");
  });

  it("keeps freelance contract when daily rate is present", () => {
    const raw = `Consultant React
Agence X
Paris
TJM 550 € / jour`;

    const result = extractOfferFromText(raw);
    expect(result.typeContrat).toBe("autre");
  });
});
