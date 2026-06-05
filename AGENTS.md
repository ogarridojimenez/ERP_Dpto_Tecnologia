# AGENTS.md — SITRADE ERP Progress Tracker

## Current Status

### Done
- **Deploy a Vercel — COMPLETADO 2026-06-05**:
  - URL producción: `https://sitrade.vercel.app` (alias de `sitrade-nipezc1yq-omar-luis-garrido-jimenezs-projects.vercel.app`)
  - Build pasa en 22.9s sin errores
  - Vercel SSO Authentication desactivada (era el 401 inicial)
  - Supabase Auth `site_url` y `uri_allow_list` configurados vía Management API
  - Login verificado end-to-end: `admin@sitrade.uci.cu` / `Admin2026!` → JWT válido
  - `apps/mobile/.env` actualizado con `EXPO_PUBLIC_SYNC_URL=https://sitrade.vercel.app/api/aft/sync`

### Done
- **Mejora #1 - Seguridad en server actions (commit `47376a5`)**: helper centralizado `src/lib/auth.ts` con `requireAuth/requireRole/ROLES/getAdminClient`; mapeo de roles aplicado.
- **Mejora #3 - Zod en todas las actions (commit `f5a6074`)**: `uuidSchema` y `syncScansSchema` en `src/lib/schemas/aft.ts`; validación UUID en AFT, Aulas y Guardia.
- **Mejora #2 - Playwright E2E (19/19 tests passing)**:
  - Suite: 4 specs (auth, aft, aulas, guardia) con 19 tests totales
  - Helpers: `tests/e2e/helpers/auth.ts` con login/logout para 6 usuarios
  - `beforeAll` de Guardia limpia datos via REST por `observaciones_generales` (no por fecha — evita timezone issues)
  - `playwright.config.ts` carga `.env` automáticamente
  - `tsconfig.json` excluye `tests/` y `playwright.config.ts`
  - `.gitignore` añade `playwright-report/`, `test-results/`
  - Scripts: `test:e2e`, `test:e2e:ui`, `test:e2e:report`
- **Fix Guardia E2E (commit pendiente)**: resueltos 3 bugs:
  - Quitado `router.refresh()` de `handleSaveEntrega` — causaba timing issues con hidratación y el toast "Rendering..."
  - Tests usan `sharedParteId` (variable compartida serial) + navegación directa por URL — evita regex de fecha (timezone issue: `2030-06-15` se muestra como "14 de junio de 2030")
  - Assertion cambiada de `toBeVisible()` a `isDisabled()` check — el botón Recibo siempre es visible, solo se habilita cuando hay entrega registrada en DB
  - `data-testid="btn-guardar-entrega"` y `data-testid="btn-guardar-recibo"` añadidos para selectores estables
- Flujo E-R completo probado y funcionando:
  - tecnicoE crea parte y llena entregas (5 áreas)
  - tecnicoR entra cuando entrega está completa y llena recibos
  - Parte pasa automáticamente a "Completado" cuando todas las áreas tienen recibo
  - Sin discrepancias en la prueba (todas las cantidades coincidieron)
- Todos los periféricos muestran "OK" en la columna estado

### Next Steps
- Probar flujo con discrepancias (cantidades diferentes entrega vs recibo)
- **Probar sync móvil↔web con `EXPO_PUBLIC_SYNC_URL=https://sitrade.vercel.app/api/aft/sync`** (requiere reiniciar Expo)
- Commitear los cambios del deploy (10 archivos modificados + `.vercelignore` nuevo + 2 `force-dynamic` exports)
- Posibles mejoras Guardia: filtrar por fechas en historial, exportar PDF del parte, notificaciones
- Mejora #4: versionar schema SQLite en `apps/mobile`
- **Pendiente**: Vercel CLI 54.9.1 ya está instalado globalmente. Si en el futuro se desinstala/actualiza, el bug del lambda puede volver (regression en `@vercel/next@4.17.2`).

### Deploy Debug (Vercel) — RESUELTO
**Sesión 2026-06-05**: deploy completado tras 2 fixes.

**Causa raíz del fallo original (2026-06-04)**:
- Bug upstream en `@vercel/next@4.17.2` (https://github.com/vercel/vercel/issues/16364) introducía error `Unable to find lambda for route: /aft/areas` con Next.js 16.x + route groups `(dashboard)`.

**Fix 1 — Actualizar Vercel CLI**:
- `npm install -g vercel@54.9.1` (de 54.2.0) → trae `@vercel/next@4.17.5` con el bug resuelto.
- `vercel build --prod --yes` ahora compila: `✓ Compiled successfully in 22.9s`.

**Fix 2 — Auth-protected pages como `force-dynamic`**:
- Las páginas que llaman a Supabase fallan en prerender (env vars ausentes durante static generation).
- Añadido `export const dynamic = "force-dynamic";` a:
  - `src/app/(dashboard)/layout.tsx` (cascada a todas las páginas autenticadas)
  - `src/app/(auth)/login/page.tsx`
- Ahora se renderizan en request-time, no en build-time.

**Fix 3 — Env vars vacías + Vercel SSO**:
- `vercel env ls production` mostraba las 3 env vars como "Encrypted" pero `vercel env pull` las bajaba como `""`. Se re-añadieron con `vercel env add ... --value "..." --yes` (3 vars: URL, ANON_KEY, SERVICE_ROLE_KEY).
- Vercel SSO Authentication (protegía con 401) → desactivada manualmente por el usuario en dashboard (Project Settings → Deployment Protection → Vercel Authentication → Off).
- Supabase Auth `site_url` y `uri_allow_list` configurados vía Management API con token personal (`sbp_...`).

**Resultado final**:
- `https://sitrade.vercel.app` → 200 (landing 31KB)
- `https://sitrade.vercel.app/login` → 200 (12KB)
- `POST /api/aft/sync` con body `{}` → 400 `{"error":"control_id and mbs[] required"}` (endpoint vivo)
- `POST /auth/v1/token` con `admin@sitrade.uci.cu` / `Admin2026!` → 200 con JWT válido (role: `admin`)

**Cambios sin commitear**:
- `package.json` — script `build` ahora es `next build --webpack` (workaround original, ya no estrictamente necesario con CLI 54.9.1 — considerar revertir a `next build` para volver a Turbopack)
- `src/app/(auth)/login/page.tsx` — `force-dynamic` export añadido
- `src/app/(dashboard)/layout.tsx` — `force-dynamic` export añadido
- `apps/mobile/.env` — `EXPO_PUBLIC_SYNC_URL` apunta a `https://sitrade.vercel.app/api/aft/sync`
- `.vercelignore` (NUEVO) — excluye `node_modules/`, `apps/`, `**/android/build/`, `**/.gradle/`, `.next/`, `out/`, `.env*`, `*.xls`, `*.pdf`, `*.log`, `*.tsbuildinfo`. Reduce upload de 201MB a ~523B. Imprescindible.
- `AGENTS.md` — esta sección
- 10 archivos UI/UX modificados (login, dashboard, guardia, sidebar, etc.)

### Critical Context
- **Commits recientes**: `47376a5` (seguridad), `f5a6074` (Zod), `1580373` (Playwright E2E base).
- Dev server arranca en puerto 3000 (3001 si ocupado). `playwright.config.ts` baseURL = `http://localhost:3000`.
- Tests E2E leen `.env` automáticamente via loader custom en `playwright.config.ts`.
- Service role key se lee de `process.env.SUPABASE_SERVICE_ROLE_KEY` (del `.env` raíz).
- `beforeAll` de Guardia limpia por `observaciones_generales=eq.Parte de prueba E2E` (no por fecha, evita timezone).
- Tests seriales usan `sharedParteId` compartido entre test 1 y test 2 para navegar directamente por URL.
- **Parte de prueba activo**: ID `9c0cfe4b-7d5e-4da0-a3b3-e96a2a00ebe5`, fecha 2026-06-04, estado "completado".
- **Parte anterior (prueba previa)**: ID `abf6b43b-3916-46b2-843b-5abe3ca74389`, fecha 2026-06-02.
- **Parte de prueba E2E (datos vivos)**: ID variable (shared), fecha 2030-06-15, estado variable.
- Tablas DB Guardia: `guardia_areas`, `guardia_perifericos`, `guardia_partes`, `guardia_registros`, `guardia_detalle`.
- `GuardiaRegistro` type en `database.ts` incluye `entregado_por_user_id` y `recibido_por_user_id`.
- Variables `.env`: `NEXT_PUBLIC_SUPABASE_URL=https://bbznwxreyqswhgtdihxe.supabase.co`, `SUPABASE_SERVICE_ROLE_KEY=eyJ...`.
- 5 roles: `admin`, `jefe`, `rrhh`, `tecnico`, `especialista_hardware`.
- **Mapeo de roles en actions**:
  - AFT escritura: admin, jefe.
  - Aulas escritura: admin, jefe, especialista_hardware.
  - Guardia crear parte + E/R: admin, jefe, tecnico.
  - Guardia eliminar parte + completar: admin, jefe.
  - Lecturas: cualquier autenticado.
- Usuarios reales en Supabase:
  - admin@sitrade.uci.cu
  - jefe@sitrade.uci.cu
  - rrhh@sitrade.uci.cu
  - tecnicoE@sitrade.uci.cu (role: tecnico)
  - tecnicoR@sitrade.uci.cu (role: tecnico)
  - hardware@sitrade.uci.cu (role: especialista_hardware)
