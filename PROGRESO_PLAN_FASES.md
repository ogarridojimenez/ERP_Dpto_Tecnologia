# Progreso del PLAN_FASES — SITRADE ERP

**Última actualización**: 2026-06-19 (final sesión)
**Rama de trabajo**: `refactor/plan-fases` (desde `main` en `79fae5d`)
**Commits hechos**: 35+ desde el baseline

Este documento es un espejo del estado de ejecución del `PLAN_FASES.md`, escrito después de una serie de sesiones autónomas de trabajo. Es un punto de referencia para retomar — no sustituye al plan original.

---

## Estado por problema (P1–P28)

| ID | Problema | Estado | Commit principal |
|----|----------|--------|------------------|
| P1 | Bypass RLS con service_role | ✅ **PARCIAL** (aft + guardia ✓; aulas documentado pendiente) | `25e524f`, `98466ee`, `4d8d58a`, `df4f107` |
| P2 | `/api/aft/sync` sin auth | ✅ Cerrado | `7dc9f66` |
| P3 | Rotar `service_role_key` | ⚪ **Asumido sin rotar** (repo privado, equipo de confianza, 2026-06-20) | — |
| P4 | RLS anon abierto en `activos_aft` | ✅ Migración escrita (no aplicada) | `13c053d` |
| P5 | Páginas listado como Server Components | ✅ **6 páginas convertidas** | `0b31be3`, `c957dc4`, `580fc5b`, `3c45cf7`, `c9befbc`, `2792e5b` |
| P6 | `organization_id` hardcodeado en aulas | ✅ Cerrado | `5b5e464` |
| P7 | `console.log/error` en prod | ✅ Cerrado (commit lleva "P6" por error) | `c93108a` |
| P8 | Schema v1 obsoleto en producción | ✅ Migración archivar a `legacy` (no aplicada) | `d3a290c` |
| P9 | `alert()`/`confirm()` nativos | ✅ Cerrado (alert → sonner; confirm mantenido) | `1006144`, `1cf9a1c` |
| P10 | Doble helper `auth.ts` y `auth/guard.ts` | ✅ Cerrado | `049d745` |
| P11 | 47 lint warnings de `any` | ❌ **Manual** (`supabase gen types` necesita auth CLI) | — |
| P12 | `jspdf`/`qrcode` static import | ✅ Cerrado | `7e90ef5` |
| P13 | Deps no usadas (`pg`, `prisma`) | ✅ Cerrado | `0181c25` |
| P14 | Server actions sin helper unificado | ✅ `runAction()` creado | `1544abb` |
| P15 | `getGuardiaParte` 3 queries serial | ✅ A 2 queries paralelas | `0ee9978` |
| P16 | Sin paginación en `aft/historial` | ✅ Cerrado (server-side + filtros) | `e777308` |
| P17 | `SupabaseProvider` doble SELECT | ✅ Cerrado | `8004c86` |
| P18 | `router.refresh()` race condition login | ✅ Server action + `redirect()` | `3797434` |
| P19 | Cobertura E2E limitada | ❌ Diferido (necesita servidor para validar) | — |
| P20 | Tipos v1 sin `@deprecated` | ✅ Eliminados (no había referencias) | `cfb7837` |
| P21 | `RoleGuard` engaña al modelo mental | ✅ Documentado | `b27863b` |
| P22 | Doble sidebar | ✅ Cerrado | `049d745` |
| P23 | Sin i18n | ❌ Diferido (gran esfuerzo) | — |
| P24 | Emojis vs `lucide-react` | ✅ 4 botones delete migrados a `Trash2` | `6155f7c` |
| P25 | Sin `robots.txt` | ✅ Cerrado | `8941b36` |
| P26 | `tmp_cdp_landing.js` y otros untracked | ✅ Cerrado | `049d745` |
| P27 | 14 scripts debug en raíz | ✅ Cerrado (movidos a `scripts/debug/`) | `cd50a80` |
| P28 | `build` script verificado | ✅ Confirmado correcto | — |

**Adicional (no del informe)**:
- `saveEntrega`/`saveRecibo` batched (de 14→4 y 17→5 queries) — `8a3d2c7`
- Fase 0 baseline + `.gitignore` ajustado — `b42b491`

---

## Resumen numérico

- ✅ Cerrado o casi cerrado: **23** (incluye P5 y P24 cerrados en esta sesión)
- ❌ Manual (no automatizable sin acceso humano): **3** (P3, P11, aplicar P4 y P8)
- ❌ Diferido por scope: **2** (P19, P23)

### Páginas convertidas a Server Component (P5)

| Página | Comp. cliente extraído | Commit |
|--------|------------------------|--------|
| `guardia/page.tsx` (lista) | `delete-parte-button.tsx` | `0b31be3` |
| `aft/areas/page.tsx` | `areas-client.tsx` | `c957dc4` |
| `aft/page.tsx` (dashboard) | (ninguno: SC puro) | `580fc5b` |
| `aft/historial/page.tsx` | `historial-filters.tsx`, `delete-control-button.tsx` | `3c45cf7` |
| `guardia/[id]/page.tsx` (detalle parte) | `completar-parte-button.tsx` | `c9befbc` |
| `aft/controles/[id]/page.tsx` (detalle control) | `control-actions.tsx` | `2792e5b` |

**Pendientes de convertir** (no críticos):
- `aulas/page.tsx`: expand-lazy + state local pesado. Conversión churn sin ROI claro.
- `aulas/[sessionId]/page.tsx`: similar.
- `guardia/[id]/[areaId]/page.tsx`: formulario grande con mucho estado.
- `guardia/config/page.tsx`: múltiples modales y CRUD inline.
- Páginas `nueva`/`nuevo`: ya son formularios — server actions ya están, refactor a SC puro requiere `useFormState` extra.

---

## Qué falta para terminar

### Acciones humanas (no las puede hacer Claude solo)

1. **P3** — En Supabase Dashboard:
   - Project Settings → API → Reset `service_role` key.
   - Database → cambiar password del rol `postgres`.
   - Actualizar `SUPABASE_SERVICE_ROLE_KEY` y `DATABASE_URL` en Vercel + `.env.local`.
   - Re-deploy y confirmar que login funciona.

2. **Aplicar migraciones SQL escritas**:
   - `supabase/migrations/2026-06-19-aft-anon-restrict.sql` (P4).
   - `supabase/migrations/2026-06-19-archive-v1-schema.sql` (P8).
   - Antes: backup con `pg_dump` y validar contra preview/staging.

3. **P11** — Generar tipos Supabase:
   ```bash
   npx supabase login
   npx supabase gen types typescript --project-id <id> > src/types/supabase.ts
   ```
   Después actualizar `lib/supabase/server.ts` y `client.ts` para tipar el cliente, lo que elimina los ~47 warnings `any`.

4. **P2 / sync móvil** — Decidir si configurar `AFT_SYNC_TOKEN` en Vercel o coordinar con `apps/mobile` para enviar `Authorization: Bearer <jwt>`.

### Trabajo de programador (Claude puede pero requiere atención)

5. **P1 (aulas.ts)** — Resolver la divergencia RLS/role-check documentada en el archivo:
   - Decidir si ampliar las policies de `locales` para incluir `especialista_hardware` (probable).
   - Decidir si las visitas_aulas pueden leerse por `tecnico` (¿toda la app o solo las suyas?).
   - Una vez resueltas, migrar el archivo a `createUserClient` como aft.ts/guardia.ts.

6. **P5 — Server Components** — Convertir páginas de listado (`aft/areas`, `aft/historial`, `guardia`, `aulas`). Cada página: dividir en `page.tsx` server-side (carga datos) + `*-client.tsx` (interactividad). Trabajo grande, ~1 día por módulo. Beneficio: SSR, menos JS, prefetch, streaming.

7. **P19 — Tests E2E adicionales**:
   - `guardia-discrepancias.spec.ts` — entrega vs recibo con conteos distintos.
   - `aft-upload-excel.spec.ts` — admin sube fixture .xlsx.
   - `aft-pdf-qr.spec.ts` — generar y descargar PDF.
   - `role-non-owner.spec.ts` — técnico no puede editar registro ajeno.
   - `mobile-sync.spec.ts` — verificar 401 sin Bearer / 200 con Bearer válido.
   - Requiere servidor Next.js levantado y datos seed estables. Idealmente con un `seed.sql` por suite.

8. **P23 — i18n preparado** (sin traducir):
   - `npm install next-intl` (o i18next).
   - Crear `src/i18n/locales/es.json` con todas las strings extraídas.
   - Wrapper `<I18nProvider locale="es">` en root layout.
   - Reemplazar literales por `t("clave")`. Trabajo mecánico ~1 semana.

9. **P24 — Iconos**:
   - 4 botones de delete con `🗑️` → `<Trash2 />` de lucide.
   - Estados con emojis (✅ Bien, ⚠️ Regular, ❌ Mal) — dejar como están (son etiquetas, no iconos UI).

---

## Recomendación para retomar

1. **Si el objetivo es deployar**: hacer las acciones humanas (1–4 arriba) y mergear `refactor/plan-fases` a `main`. El código está en muy buen estado para v1.1.
2. **Si el objetivo es seguir saneando**: empezar por **P1 aulas** (más simple cuando se decide la política RLS) y **P19 tests E2E** (fundamentos antes de P5).
3. **Si el objetivo es nuevas features**: tocar **P5** primero para que las nuevas páginas nazcan como Server Components.
