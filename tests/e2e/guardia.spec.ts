import { test, expect, request as playwrightRequest } from "@playwright/test";
import { login } from "./helpers/auth";

const SUPABASE_URL = "https://bbznwxreyqswhgtdihxe.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function deleteParteByFecha(fecha: string) {
  const ctx = await playwrightRequest.newContext({
    extraHTTPHeaders: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  const r = await ctx.get(
    `${SUPABASE_URL}/rest/v1/guardia_partes?fecha=eq.${fecha}&select=id`
  );
  const partes = (await r.json()) as any[];
  if (!Array.isArray(partes) || partes.length === 0) {
    await ctx.dispose();
    return;
  }
  for (const p of partes) {
    const regs = (await (await ctx.get(`${SUPABASE_URL}/rest/v1/guardia_registros?guardia_parte_id=eq.${p.id}&select=id`)).json()) as any[];
    if (regs.length > 0) {
      const ids = regs.map((x) => x.id).join(",");
      await ctx.delete(`${SUPABASE_URL}/rest/v1/guardia_detalle?guardia_registro_id=in.(${ids})`);
    }
    await ctx.delete(`${SUPABASE_URL}/rest/v1/guardia_registros?guardia_parte_id=eq.${p.id}`);
    await ctx.delete(`${SUPABASE_URL}/rest/v1/guardia_partes?id=eq.${p.id}`);
  }
  await ctx.dispose();
}

const ENTREGADOR = "Tecnico Entrega E2E";
const RECEPTOR = "Tecnico Recibo E2E";
const SOL_E = "SOL-E-E2E";
const SOL_R = "SOL-R-E2E";

// Fecha de un solo uso que no debe existir
const FECHA_E2E = "2030-06-15";

test.describe.serial("Guardia - Flujo Entrega-Recibo", () => {
  test.beforeAll(async () => {
    if (!SERVICE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY no definida en env");
    }
    await deleteParteByFecha(FECHA_E2E);
  });

  test("tecnicoE crea parte, llena 5 entregas", async ({ page }) => {
    await login(page, "tecnicoE");

    await page.goto("/guardia");
    await page.getByRole("link", { name: /nuevo parte/i }).click();
    await page.waitForURL("**/guardia/nueva");

    await page.locator('input[type="date"]').fill(FECHA_E2E);
    await page.getByPlaceholder("Observaciones generales del parte (opcional)").fill("Parte de prueba E2E");
    await page.getByRole("button", { name: /crear parte/i }).click();
    await page.waitForURL("**/guardia", { timeout: 15_000 });

    // Buscar el link al parte recien creado (por fecha formateada es-CU)
    const link = page.locator("a").filter({ hasText: /(14|15) de junio de 2030/ }).first();
    await link.click();
    await page.waitForURL(/\/guardia\/[0-9a-f-]+$/);
    await expect(page.getByText(/parte de guardia/i).first()).toBeVisible();

    // Llenar entrega en cada area
    for (let i = 0; i < 5; i++) {
      await page.goto("/guardia");
      await page.locator("a").filter({ hasText: /(14|15) de junio de 2030/ }).first().click();
      await page.waitForURL(/\/guardia\/[0-9a-f-]+$/);
      await page.waitForLoadState("networkidle");

      await page.getByRole("link", { name: /llenar entrega|ver \/ editar/i }).first().click();
      await page.waitForURL(/\/guardia\/[0-9a-f-]+\/[0-9a-f-]+$/);
      // Esperar hidratacion completa (el toast "Rendering..." desaparece)
      await page.waitForFunction(
        () => !document.body.textContent?.includes("Rendering"),
        { timeout: 10_000 }
      );

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

      const saveBtn = page.getByRole("button", { name: /guardar entrega/i });
      await expect(saveBtn).toBeEnabled({ timeout: 10_000 });
      await saveBtn.click();
      // Tras guardar, router.refresh() rerenderiza la pagina
      await page.waitForFunction(
        () => !document.body.textContent?.includes("Rendering"),
        { timeout: 15_000 }
      );
    }
  });

  test("tecnicoR llena los 5 recibos con cantidades identicas", async ({ page }) => {
    await login(page, "tecnicoR");

    for (let i = 0; i < 5; i++) {
      await page.goto("/guardia");
      await page.locator("a").filter({ hasText: /(14|15) de junio de 2030/ }).first().click();
      await page.waitForURL(/\/guardia\/[0-9a-f-]+$/);
      await page.waitForLoadState("networkidle");

      await page.getByRole("link", { name: /llenar recibo|ver \/ editar/i }).first().click();
      await page.waitForURL(/\/guardia\/[0-9a-f-]+\/[0-9a-f-]+$/);
      await page.waitForFunction(
        () => !document.body.textContent?.includes("Rendering"),
        { timeout: 10_000 }
      );

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

      const saveBtn = page.getByRole("button", { name: /guardar recibo/i });
      await expect(saveBtn).toBeEnabled({ timeout: 10_000 });
      await saveBtn.click();
      await page.waitForURL(/\/guardia\/[0-9a-f-]+$/, { timeout: 15_000 });
      await page.waitForFunction(
        () => !document.body.textContent?.includes("Rendering"),
        { timeout: 15_000 }
      );
    }

    await expect(page.getByText(/completado/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
