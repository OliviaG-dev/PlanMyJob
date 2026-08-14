import { describe, expect, it } from "vitest";
import { formatShareError } from "./shareErrors";

describe("formatShareError", () => {
  it("returns unknown error for non-object values", () => {
    expect(formatShareError("boom")).toBe("Erreur inconnue");
  });

  it("maps PostgREST missing function to migration hint", () => {
    expect(
      formatShareError({ code: "PGRST202", message: "Could not find the function" }),
    ).toContain("Configuration Supabase incomplète");
  });

  it("maps missing SQL function code", () => {
    expect(
      formatShareError({ code: "42883", message: "function get_public_share does not exist" }),
    ).toContain("Fonction SQL manquante");
  });

  it("maps missing monthly_reports table", () => {
    expect(
      formatShareError({
        code: "42P01",
        message: 'relation "monthly_reports" does not exist',
      }),
    ).toContain("monthly_reports");
  });

  it("maps missing shares table", () => {
    expect(
      formatShareError({
        code: "42P01",
        message: 'relation "shares" does not exist',
      }),
    ).toContain("shares");
  });

  it("maps auth and candidature errors", () => {
    expect(formatShareError(new Error("not authenticated"))).toContain(
      "Session expirée",
    );
    expect(formatShareError(new Error("candidature not found"))).toContain(
      "Candidature introuvable",
    );
  });

  it("returns original message as fallback", () => {
    expect(formatShareError(new Error("Custom failure"))).toBe("Custom failure");
  });
});
