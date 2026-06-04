import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("AFT - Acceso restringido", () => {
  test("admin puede ver dashboard AFT", async ({ page }) => {
    await login(page, "admin");
    await page.goto("/aft");
    await expect(page.getByText(/activos fijos|aft/i).first()).toBeVisible();
  });

  test("jefe puede ver dashboard AFT", async ({ page }) => {
    await login(page, "jefe");
    await page.goto("/aft");
    await expect(page.getByText(/activos fijos|aft/i).first()).toBeVisible();
  });

  test("tecnicoE NO ve enlace de AFT en sidebar", async ({ page }) => {
    await login(page, "tecnicoE");
    await expect(page.getByRole("link", { name: /activos fijos/i })).not.toBeVisible();
  });

  test("tecnicoE NO puede acceder a /aft directamente", async ({ page }) => {
    await login(page, "tecnicoE");
    await page.goto("/aft");
    await expect(page.getByText(/acceso restringido/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("rrhh NO ve enlace de AFT en sidebar", async ({ page }) => {
    await login(page, "rrhh");
    await expect(page.getByRole("link", { name: /activos fijos/i })).not.toBeVisible();
  });
});
