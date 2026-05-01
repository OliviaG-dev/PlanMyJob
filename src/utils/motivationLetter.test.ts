import { describe, expect, it } from "vitest";
import {
  computeMatchingScore,
  detectToneFromOffer,
  generateLetter,
  type GenerateLetterInput,
} from "./motivationLetter";

describe("motivationLetter utils", () => {
  it("detects startup tone when startup keywords dominate", () => {
    const tone = detectToneFromOffer(
      "Startup agile orientee impact avec forte autonomie et innovation"
    );
    expect(tone).toBe("startup");
  });

  it("detects classic tone when classic keywords dominate", () => {
    const tone = detectToneFromOffer(
      "Environnement axe rigueur, process, qualite et conformite"
    );
    expect(tone).toBe("classic");
  });

  it("computes a bounded matching score and keeps matched skills", () => {
    const input: GenerateLetterInput = {
      company: "PlanMyJob",
      position: "Frontend Developer",
      skills: ["React", "TypeScript", "Jest"],
      achievement: "j'ai augmente la conversion de 22%",
      motivation: "vos produits ont un impact concret",
      tone: "modern",
      offerText:
        "Nous recherchons un profil React TypeScript avec 3 ans d'experience",
      yearsExperience: 3,
    };

    const result = computeMatchingScore(input);

    expect(result.score).toBeGreaterThanOrEqual(12);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.matchedSkills).toEqual(
      expect.arrayContaining(["React", "TypeScript"])
    );
  });

  it("generates deterministic letter content for identical input", () => {
    const input: GenerateLetterInput = {
      company: "PlanMyJob",
      position: "Frontend Developer",
      skills: ["React", "TypeScript", "Jest"],
      achievement: "j'ai refondu un tunnel critique",
      motivation: "votre mission me parle",
      tone: "modern",
      firstName: "Olivia",
      lastName: "Dupont",
      offerText: "React TypeScript collaboration equipe impact",
      yearsExperience: 4,
    };

    const letterA = generateLetter(input);
    const letterB = generateLetter(input);

    expect(letterA).toBe(letterB);
    expect(letterA).toContain("Objet: Candidature - Frontend Developer");
    expect(letterA).toContain("Cordialement,");
    expect(letterA).toContain("Olivia Dupont");
    expect(letterA).toContain("PlanMyJob");
  });
});
