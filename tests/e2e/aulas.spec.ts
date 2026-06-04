import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("Aulas", () => {
  test("admin puede ver historial de revisiones", async ({ page }) => {
    await login(page, "admin");
    await page.goto("/aulas");
    await expect(page.getByText(/revisi[oó]n de aulas/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /nueva revisi[oó]n/i })).toBeVisible();
  });

  test("especialista_hardware puede ver Aulas (tiene acceso de escritura)", async ({ page }) => {
    await login(page, "especialista");
    await page.goto("/aulas");
    await expect(page.getByText(/revisi[oó]n de aulas/i).first()).toBeVisible();
  });

  test("tecnicoE puede ver Aulas", async ({ page }) => {
    await login(page, "tecnicoE");
    await page.goto("/aulas");
    await expect(page.getByText(/revisi[oó]n de aulas/i).first()).toBeVisible();
  });
});
