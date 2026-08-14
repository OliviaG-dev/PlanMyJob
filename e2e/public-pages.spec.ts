import { expect, test } from "@playwright/test";
import { hasPublicBilanToken, hasPublicShareToken } from "./helpers/env";

test.describe("public share page", () => {
  test("shows unavailable message for invalid share token", async ({ page }) => {
    await page.goto("/share/playwright-invalid-token-e2e");

    await expect(
      page.getByRole("heading", { name: "Lien indisponible" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/introuvable|n'existe plus/i),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Accéder à PlanMyJob" }),
    ).toBeVisible();
  });

  test.describe("with valid share token", () => {
    test.skip(
      !hasPublicShareToken(),
      "Set PLAYWRIGHT_PUBLIC_SHARE_TOKEN in .env for this test",
    );

    test("renders shared candidature report", async ({ page }) => {
      const token = process.env.PLAYWRIGHT_PUBLIC_SHARE_TOKEN?.trim();
      if (!token) {
        throw new Error("PLAYWRIGHT_PUBLIC_SHARE_TOKEN is required");
      }

      await page.goto(`/share/${token}`);

      await expect(page.getByText("Rapport de candidature")).toBeVisible({
        timeout: 10_000,
      });
      await expect(
        page.getByRole("button", { name: "Télécharger PDF" }),
      ).toBeVisible();
    });
  });
});

test.describe("public monthly report page", () => {
  test("shows unavailable message for invalid bilan token", async ({ page }) => {
    await page.goto("/bilan/playwright-invalid-token-e2e");

    await expect(
      page.getByRole("heading", { name: "Lien indisponible" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/introuvable|n'existe plus/i),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Accéder à PlanMyJob" }),
    ).toBeVisible();
  });

  test.describe("with valid bilan token", () => {
    test.skip(
      !hasPublicBilanToken(),
      "Set PLAYWRIGHT_PUBLIC_BILAN_TOKEN in .env for this test",
    );

    test("renders monthly report", async ({ page }) => {
      const token = process.env.PLAYWRIGHT_PUBLIC_BILAN_TOKEN?.trim();
      if (!token) {
        throw new Error("PLAYWRIGHT_PUBLIC_BILAN_TOKEN is required");
      }

      await page.goto(`/bilan/${token}`);

      await expect(page.getByText("Bilan mensuel")).toBeVisible({
        timeout: 10_000,
      });
      await expect(
        page.getByRole("button", { name: "Télécharger PDF" }),
      ).toBeVisible();
    });
  });
});
