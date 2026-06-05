import { test, expect } from "@playwright/test";
import { login, expectNotVisible } from "./helpers/auth";

const USERS = ["admin", "jefe", "rrhh", "tecnicoE", "tecnicoR", "especialista"] as const;

test.describe("Autenticacion", () => {
  test("login con credenciales invalidas muestra error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("admin@sitrade.uci.cu");
    await page.getByLabel("Contraseña").fill("password-equivocada");
    await page.getByRole("button", { name: /iniciar sesi[oó]n/i }).click();
    await expect(page.getByText(/credenciales|invalid|incorrect/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  for (const u of USERS) {
    test(`login correcto redirige al dashboard (${u})`, async ({ page }) => {
      await login(page, u);
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByText(/SITRADE|panel|dashboard/i).first()).toBeVisible();
    });
  }

  test("tecnico no ve el enlace de Activos Fijos en el sidebar", async ({ page }) => {
    await login(page, "tecnicoE");
    await expectNotVisible(page, /activos fijos/i);
  });

  test("admin si ve el enlace de Activos Fijos en el sidebar", async ({ page }) => {
    await login(page, "admin");
    await expect(page.getByRole("link", { name: /activos fijos/i })).toBeVisible();
  });
});
