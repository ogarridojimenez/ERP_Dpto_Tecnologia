import { type Page, expect } from "@playwright/test";

export type TestUser = "admin" | "jefe" | "rrhh" | "tecnico" | "tecnicoE" | "tecnicoR" | "especialista";

const CREDENTIALS: Record<TestUser, { email: string; password: string }> = {
  admin: { email: "admin@sitrade.uci.cu", password: "Admin2026!" },
  jefe: { email: "jefe@sitrade.uci.cu", password: "Jefe2026!" },
  rrhh: { email: "rrhh@sitrade.uci.cu", password: "Rrhh2026!" },
  tecnico: { email: "tecnicoE@sitrade.uci.cu", password: "Tecnico2026!" },
  tecnicoE: { email: "tecnicoE@sitrade.uci.cu", password: "Tecnico2026!" },
  tecnicoR: { email: "tecnicoR@sitrade.uci.cu", password: "Tecnico2026!" },
  especialista: { email: "hardware@sitrade.uci.cu", password: "Hardware2026!" },
};

export async function login(page: Page, user: TestUser) {
  const { email, password } = CREDENTIALS[user];
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: /entrar|iniciar/i }).click();
  await page.waitForURL("**/dashboard**", { timeout: 30_000 });
}

export async function logout(page: Page) {
  const btn = page.getByRole("button", { name: /cerrar sesi[oó]n/i });
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
  } else {
    await page.goto("/login");
  }
  await page.waitForURL("**/login**", { timeout: 10_000 }).catch(() => {});
}

export async function expectVisible(page: Page, text: string | RegExp) {
  await expect(page.getByText(text).first()).toBeVisible({ timeout: 10_000 });
}

export async function expectNotVisible(page: Page, text: string | RegExp) {
  await expect(page.getByText(text).first()).not.toBeVisible({ timeout: 5_000 });
}

export function todayDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function previousDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
