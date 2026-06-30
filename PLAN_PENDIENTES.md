# Plan de Pendientes — SITRADE ERP

**Generado**: 2026-06-30 basado en análisis de `PLAN_FASES.md`, `PROGRESO_PLAN_FASES.md`, `MEJORAS.md`, `AGENTS.md`.
**Rama actual**: `refactor/plan-fases` (40 commits ahead de `main`).
**Estado**: 23/28 problemas del plan original cerrados. **Fase 0 completada 2026-06-30**. Pendientes organizados por fases.

---

## ✅ Fase 0 — Merge y estabilización (COMPLETADA 2026-06-30)

| # | Tarea | Estado |
|---|-------|--------|
| 0.1 | Merge `refactor/plan-fases` → `main` | ✅ Fast-forward `c7eeaac` |
| 0.2 | Push a origin | ✅ `main` actualizado |
| 0.3 | P11 residual — lint errors | ✅ 23 errors (`any` intencionales), 14 warnings — documentados |

---

## Fase 1 — Seguridad remanente

| # | Tarea | Archivos | Estado |
|---|-------|----------|--------|
| 1.1 | P1 aulas — migrar `getAdminClient` a sesión | `actions/aulas.ts` | ✅ |
| 1.2 | RLS policies: locales + visitas_aulas + medios | `migrations/2026-06-30-aulas-rls-fix.sql` | ✅ Pendiente aplicar SQL |
| 1.3 | P3 — Rotar `service_role_key` y password Postgres | Acción manual en Supabase Dashboard | 🔴 **Pendiente** |

---

## Fase 2 — UX / Resiliencia

| # | Tarea | Archivos |
|---|-------|----------|
| 2.1 | Error Boundaries (`error.tsx`) | 5 rutas: `(dashboard)/`, `guardia/`, `aft/`, `aulas/`, `rrhh/` |
| 2.2 | Loading states + Skeleton | `loading.tsx` en dashboard/guardia/aft/aulas + componente `<Skeleton>` |
| 2.3 | autoComplete en login | `login/page.tsx` — `autoComplete="current-password"` |
| 2.4 | Scrollbar-gutter mobile sidebar | `dashboard-chrome.tsx` — `overflow:hidden` → `scrollbarGutter:stable` |

---

## Fase 3 — Refactor / Deuda técnica

| # | Tarea | Archivos |
|---|-------|----------|
| 3.1 | Hook `useSupabaseQuery` reusable | `src/hooks/useSupabaseQuery.ts` — migrar 18 páginas del patrón `useState+useEffect` |
| 3.2 | Eliminar stubs AFT v1 deprecados | `actions/aft.ts` — 6 funciones stub (~60 líneas) |
| 3.3 | Centralizar schemas Zod | `src/lib/schemas/index.ts` — exportar `uuidSchema` |
| 3.4 | Reducir usos restantes de `getAdminClient` | Verificar ≤5 usos justificados tras migrar aulas |

---

## Fase 4 — Rendimiento / Build

| # | Tarea | Detalle |
|---|-------|---------|
| 4.1 | Fix font preload 404 en producción | `src/app/layout.tsx` — cambiar import de fuentes Geist |
| 4.2 | Confirmar Turbopack build | `package.json` — `next build` sin `--webpack` (ya verificado) |
| 4.3 | Script E2E con `next start` | `test:e2e:ci`: build + playwright test en servidor de producción |

---

## Fase 5 — Testing

| # | Tarea | Detalle |
|---|-------|---------|
| 5.1 | Tests E2E adicionales (P19) | 5 specs: discrepancias guardia, upload Excel, PDF QR, role-non-owner, mobile-sync |
| 5.2 | Datos seed estables | `tests/e2e/fixtures/seed.sql` + script `npm run e2e:seed` |
| 5.3 | CI pipeline | GitHub Actions con lint + typecheck + E2E |

---

## Fase 6 — Producto

| # | Tarea | Detalle |
|---|-------|---------|
| 6.1 | Sync móvil↔web — probar | Verificar `EXPO_PUBLIC_SYNC_URL` + flujo JWT en `apps/mobile` |
| 6.2 | SQLite schema versionado | Mejora #4 — versionar schema SQLite en `apps/mobile` |
| 6.3 | RRHH — módulo completo | Server actions, Zod, páginas CRUD siguiendo convención existente |
| 6.4 | i18n preparado (opcional) | `next-intl`, extraer strings a `es.json`, infraestructura lista |

---

## Resumen

| Fase | Ítems | Esfuerzo | Dependencias |
|------|-------|----------|--------------|
| 0 — Merge | 3 | 1 día | Ninguna |
| 1 — Seguridad | 3 | 1 día (1.3 manual) | Fase 0 |
| 2 — UX | 4 | 2 días | Fase 0 |
| 3 — Refactor | 4 | 3 días | Fase 1 |
| 4 — Perf/Build | 3 | 1 día | Fase 0 |
| 5 — Testing | 3 | 3 días | Fase 0 (puede empezar en paralelo con Fase 3) |
| 6 — Producto | 4 | 2-4 semanas | Fase 0 + Fase 3 |

**Camino crítico**: 0 → 1 → 3 → 6 (RRHH). Fases 2, 4, 5 son paralelizables.
