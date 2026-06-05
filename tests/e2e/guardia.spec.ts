import { test, expect, request as playwrightRequest } from "@playwright/test";
import { login } from "./helpers/auth";

const SUPABASE_URL = "https://bbznwxreyqswhgtdihxe.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const ENTREGADOR = "Tecnico Entrega E2E";
const RECEPTOR = "Tecnico Recibo E2E";
const SOL_E = "SOL-E-E2E";
const SOL_R = "SOL-R-E2E";
const OBS_E2E = "Parte de prueba E2E";

let sharedParteId = "";
let consoleErrors: string[] = [];

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

async function deleteAllE2EDetails() {
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

test.describe.serial("Guardia - Flujo Entrega-Recibo", () => {
  test.beforeAll(async () => {
    if (!SERVICE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY no definida en env");
    await deleteAllE2EDetails();
  });

  test("tecnicoE crea parte, llena 5 entregas", async ({ page }) => {
    consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await login(page, "tecnicoE");

    await page.goto("/guardia");
    await page.getByRole("link", { name: /nuevo parte/i }).click();
    await page.waitForURL("**/guardia/nueva");

    await page.locator('input[type="date"]').fill("2030-06-15");
    await page.getByPlaceholder("Observaciones generales del parte (opcional)").fill(OBS_E2E);
    await page.getByRole("button", { name: /crear parte/i }).click();
    await page.waitForURL("**/guardia", { timeout: 15_000 });

    const partes = await apiGet(
      `guardia_partes?select=id&observaciones_generales=eq.${encodeURIComponent(OBS_E2E)}&order=created_at.desc&limit=1`
    );
    sharedParteId = partes?.[0]?.id;
    expect(sharedParteId).toBeTruthy();

    await page.goto(`/guardia/${sharedParteId}`);
    await expect(page.getByText(/parte de guardia/i).first()).toBeVisible();

    for (let i = 0; i < 5; i++) {
      await page.goto(`/guardia/${sharedParteId}`);
      await page.waitForLoadState("networkidle");

      const entregaLink = page.getByRole("link", { name: /llenar entrega/i }).first();
      if (await entregaLink.count() === 0) break;
      await entregaLink.click();
      await page.waitForURL(/\/guardia\/[0-9a-f-]+\/[0-9a-f-]+$/);

      const entTab = page.getByRole("button", { name: /^Entrega/ });
      await entTab.click();

      const entNombre = page.getByPlaceholder("Nombre completo").first();
      if (await entNombre.isDisabled()) continue;

      await entNombre.fill(ENTREGADOR);
      await page.getByPlaceholder("Numero de solapin").first().fill(SOL_E);

      const numberInputs = page.locator('input[type="number"]');
      const n = await numberInputs.count();
      for (let j = 0; j < n; j++) {
        await numberInputs.nth(j).fill("5");
      }

      const saveBtn = page.getByTestId("btn-guardar-entrega");
      await expect(saveBtn).toBeEnabled({ timeout: 10_000 });
      await saveBtn.click();

      // Wait for either: Recibo tab becomes enabled OR save error
      await expect(async () => {
        const reciboBtn = page.getByRole("button", { name: /^Recibo/ });
        const isDisabled = await reciboBtn.isDisabled();
        expect(isDisabled).toBe(false);
      }).toPass({ timeout: 15_000 });

      // Log any console errors
      const errors = consoleErrors.filter(e => e.includes("saveEntrega"));
      if (errors.length > 0) {
        console.log(`[Area ${i + 1}] saveEntrega errors:`, errors);
      }
    }

    const regs = await apiGet(
      `guardia_registros?select=fecha_hora_entrega,entregado_por_nombre&guardia_parte_id=eq.${sharedParteId}`
    );
    const withEntrega = regs.filter((r: any) => r.fecha_hora_entrega);
    expect(withEntrega.length).toBe(5);
  });

  test("tecnicoR llena los 5 recibos con cantidades identicas", async ({ page }) => {
    await login(page, "tecnicoR");
    expect(sharedParteId).toBeTruthy();

    for (let i = 0; i < 5; i++) {
      await page.goto(`/guardia/${sharedParteId}`);
      await page.waitForLoadState("networkidle");

      const reciboLink = page.getByRole("link", { name: /llenar recibo/i }).first();
      if (await reciboLink.count() === 0) break;
      await reciboLink.click();
      await page.waitForURL(/\/guardia\/[0-9a-f-]+\/[0-9a-f-]+$/);

      const reciboBtn = page.getByRole("button", { name: /^Recibo/ });
      await reciboBtn.click();

      const recNombre = page.getByPlaceholder("Nombre completo").first();
      if (await recNombre.isDisabled()) continue;

      await recNombre.fill(RECEPTOR);
      await page.getByPlaceholder("Numero de solapin").first().fill(SOL_R);

      const numberInputs = page.locator('input[type="number"]');
      const n = await numberInputs.count();
      for (let j = 0; j < n; j++) {
        await numberInputs.nth(j).fill("5");
      }

      const saveBtn = page.getByTestId("btn-guardar-recibo");
      await expect(saveBtn).toBeEnabled({ timeout: 10_000 });
      await saveBtn.click();
      await page.waitForURL(/\/guardia\/[0-9a-f-]+$/, { timeout: 15_000 });
    }

    await expect(page.getByText(/completado/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
