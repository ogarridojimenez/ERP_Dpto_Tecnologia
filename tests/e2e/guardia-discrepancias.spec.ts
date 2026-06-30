import { test, expect, request as playwrightRequest } from "@playwright/test";
import { login } from "./helpers/auth";

const SUPABASE_URL = "https://bbznwxreyqswhgtdihxe.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const OBS_E2E = "Discrepancia test E2E";

let sharedParteId = "";

async function apiGet(path: string) {
  const ctx = await playwrightRequest.newContext({
    extraHTTPHeaders: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  const r = await ctx.get(`${SUPABASE_URL}/rest/v1/${path}`);
  const data = await r.json();
  await ctx.dispose();
  return data as any[];
}

async function apiDelete(path: string) {
  const ctx = await playwrightRequest.newContext({
    extraHTTPHeaders: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  await ctx.delete(`${SUPABASE_URL}/rest/v1/${path}`);
  await ctx.dispose();
}

async function cleanup() {
  const partes = await apiGet(
    `guardia_partes?select=id&observaciones_generales=eq.${encodeURIComponent(OBS_E2E)}`
  );
  for (const p of partes || []) {
    const regs = await apiGet(`guardia_registros?select=id&guardia_parte_id=eq.${p.id}`);
    if (Array.isArray(regs) && regs.length > 0) {
      const ids = regs.map((r: any) => r.id).join(",");
      await apiDelete(`guardia_detalle?guardia_registro_id=in.(${ids})`);
    }
    await apiDelete(`guardia_registros?guardia_parte_id=eq.${p.id}`);
    await apiDelete(`guardia_partes?id=eq.${p.id}`);
  }
}

test.describe.serial("Guardia - Discrepancias", () => {
  test.beforeAll(async () => {
    if (!SERVICE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY no definida en env");
    await cleanup();
  });

  test.afterAll(async () => {
    await cleanup();
  });

  test("tecnicoE crea parte y llena entregas con cantidades especificas", async ({ page }) => {
    await login(page, "tecnicoE");
    await page.goto("/guardia");
    await page.getByRole("link", { name: /nuevo parte/i }).click();
    await page.waitForURL("**/guardia/nueva");

    await page.locator('input[type="date"]').fill("2030-06-20");
    await page.getByPlaceholder("Observaciones generales del parte (opcional)").fill(OBS_E2E);
    await page.getByRole("button", { name: /crear parte/i }).click();
    await page.waitForURL("**/guardia", { timeout: 15_000 });

    const partes = await apiGet(
      `guardia_partes?select=id&observaciones_generales=eq.${encodeURIComponent(OBS_E2E)}&order=created_at.desc&limit=1`
    );
    sharedParteId = partes?.[0]?.id;
    expect(sharedParteId).toBeTruthy();

    for (let i = 0; i < 5; i++) {
      await page.goto(`/guardia/${sharedParteId}`);
      await page.waitForLoadState("networkidle");

      const entregaLink = page.getByRole("link", { name: /llenar entrega/i }).first();
      if (await entregaLink.count() === 0) break;
      await entregaLink.click();
      await page.waitForURL(/\/guardia\/[0-9a-f-]+\/[0-9a-f-]+$/);

      await page.getByRole("button", { name: /^Entrega/ }).click();

      const entNombre = page.getByPlaceholder("Nombre completo").first();
      if (await entNombre.isDisabled()) continue;

      await entNombre.fill("Tecnico Entrega Disc");
      await page.getByPlaceholder("Numero de solapin").first().fill("SOL-DISC-E");

      const numberInputs = page.locator('input[type="number"]');
      const n = await numberInputs.count();
      for (let j = 0; j < n; j++) {
        await numberInputs.nth(j).fill("5");
      }

      await page.getByTestId("btn-guardar-entrega").click();
      await expect(async () => {
        const reciboBtn = page.getByRole("button", { name: /^Recibo/ });
        await expect(reciboBtn).not.toBeDisabled();
      }).toPass({ timeout: 15_000 });
    }
  });

  test("tecnicoR llena recibos con cantidades distintas (discrepancia)", async ({ page }) => {
    await login(page, "tecnicoR");
    expect(sharedParteId).toBeTruthy();

    for (let i = 0; i < 5; i++) {
      await page.goto(`/guardia/${sharedParteId}`);
      await page.waitForLoadState("networkidle");

      const reciboLink = page.getByRole("link", { name: /llenar recibo/i }).first();
      if (await reciboLink.count() === 0) break;
      await reciboLink.click();
      await page.waitForURL(/\/guardia\/[0-9a-f-]+\/[0-9a-f-]+$/);

      await page.getByRole("button", { name: /^Recibo/ }).click();

      const recNombre = page.getByPlaceholder("Nombre completo").first();
      if (await recNombre.isDisabled()) continue;

      await recNombre.fill("Tecnico Recibo Disc");
      await page.getByPlaceholder("Numero de solapin").first().fill("SOL-DISC-R");

      const numberInputs = page.locator('input[type="number"]');
      const n = await numberInputs.count();
      for (let j = 0; j < n; j++) {
        await numberInputs.nth(j).fill(j === 0 ? "4" : "5");
      }

      await page.getByTestId("btn-guardar-recibo").click();
      await page.waitForURL(/\/guardia\/[0-9a-f-]+$/, { timeout: 15_000 });
    }

    await expect(page.getByText(/discrepancia|Diferencia|diferente/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
