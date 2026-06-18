# Informe de Análisis Senior — SITRADE ERP

**Proyecto**: Sistema Integrado de Tecnología, Activos y Departamentos (Facultad de Ciberseguridad, UCI)
**Stack**: Next.js 16.2 (App Router) + React 19 + Supabase (Postgres 16 + Auth + RLS) + Tailwind 4 + Zod + Playwright
**Despliegue**: Vercel (`https://sitrade.vercel.app`) + app móvil Expo (`apps/mobile`)
**Fecha del análisis**: 2026-06-16

---

## 1. Resumen ejecutivo

SITRADE es un ERP departamental funcional, en producción, con **4 módulos** (Guardia, Aulas, AFT, RRHH-stub) y soporte responsive desktop/mobile. La calidad general es **buena para una v1**: arquitectura limpia, autenticación centralizada, validación Zod en server actions, 19 tests E2E pasando, CI configurado y un esquema SQL serio con índices y RLS.

Los **principales puntos débiles** son: (1) **bypass sistemático de RLS** usando `service_role_key` en todas las server actions — se pierde el valor defensivo del RLS que sí está bien escrito; (2) **endpoint `/api/aft/sync` sin autenticación** — cualquiera con la URL puede marcar MBs como escaneados; (3) **patrón de fetch en cliente** repetido en ~18 páginas (`useState/useEffect/createClient` directo), que mezcla server/client innecesariamente; (4) **deuda técnica visible** en el repo (47 lint warnings de `any`, schema v1 obsoleto conviviendo con v2, 5 tablas RRHH vacías, scripts debug en raíz). Ningún punto es bloqueante, todos son corregibles.

**Veredicto**: producto sólido en su núcleo de Guardia/Aulas/AFT, pero con superficie de ataque innecesaria y deuda técnica que conviene saldar **antes** de abrir RRHH y antes de que más usuarios entren.

---

## 2. Lo que está bien (logros)

### 2.1 Seguridad de autenticación
- **Auth centralizada** en `src/lib/auth.ts` (73 líneas) con `requireAuth/requireRole/ROLES`. Una sola fuente de verdad para roles.
- **Middleware de Next.js** (`src/middleware.ts`) protege rutas `/dashboard`, `/guardia`, `/aulas`, `/aft`, `/rrhh` y redirige sin sesión a `/login`.
- **5 roles** modelados (`admin/jefe/rrhh/tecnico/especialista_hardware`) con mapping claro de permisos por módulo en `ROLES`.
- **Trigger `handle_new_user`** crea el perfil automáticamente al alta en `auth.users`.
- **Verificación de "dueño"** en saveEntrega/saveRecibo: un técnico no puede editar la entrega/recibo de otro técnico (sólo admin/jefe pueden).

### 2.2 Validación
- **Zod en todas las server actions** con schemas centralizados (`src/lib/schemas/aft.ts`, `aulas.ts`). UUIDs validados (Mejora #3 ya implementada).
- **CHECK constraints** robustos en SQL: códigos de local (`^[A-Za-z0-9][A-Za-z0-9 -]{0,29}$`), enums de estado, fechas, conteos no negativos.
- **UNIQUE constraints** correctos: `(organization_id, fecha)` en partes de guardia, `(visita_id, medio_id)` en detalles, etc.

### 2.3 Esquema de base de datos
- **20 tablas** bien modeladas con soft-delete (`deleted_at`), `created_at/updated_at` y `user_id` automático.
- **Triggers** `handle_updated_at()` y `force_user_id()` aplicados a 16+ tablas.
- **Índices bien pensados**: parciales `WHERE deleted_at IS NULL`, compuestos para queries frecuentes (`fecha_visita DESC, locale_id`), GIN trigram para búsqueda fuzzy (`nombre`, `marca`, `modelo`), índices condicionales para alertas (incidencias urgentes).
- **Generated columns** en `prenominas` (`total_devengado`, `total`) calculados en DB.
- **RLS policies** completas con funciones helper (`user_role()`, `user_organization_id()`).

### 2.4 Testing
- **19 tests E2E Playwright** pasando (auth, aft, aulas, guardia con flujo E↔R completo).
- Helpers limpios (`tests/e2e/helpers/auth.ts`), credenciales por usuario, `data-testid` estables en botones críticos.
- **CI en GitHub Actions** con lint + typecheck + supabase db lint.

### 2.5 UX y mobile
- **Responsive completo** ya commiteado: hamburger menu, drawer nav, tablas con scroll horizontal en mobile.
- **Loading states + Error boundaries** ya creados (la lista MEJORAS.md está desactualizada; estos archivos existen: `dashboard/loading.tsx`, `error.tsx`, `aft/loading.tsx`, etc.).
- **Componente Skeleton** ya extraído a `src/components/ui/skeleton.tsx`.
- Diseño coherente: gradientes consistentes por módulo (azul=Guardia, esmeralda=Aulas, violeta=AFT, fucsia=RRHH).
- **Generación de PDF** con QRs (jsPDF + qrcode) bien implementada en `QrsPdfButton.tsx`.

### 2.6 Deploy y configuración
- **Vercel CLI 54.9.1** con `@vercel/next@4.17.5` (workaround del bug de Next 16 + route groups documentado en AGENTS.md).
- `.vercelignore` reduce el upload de **201MB a ~523B**.
- `force-dynamic` aplicado correctamente a páginas que dependen de Supabase en runtime.
- App móvil Expo apuntando a producción vía `EXPO_PUBLIC_SYNC_URL`.

---

## 3. Problemas detectados (con severidad)

### Críticos (atender antes de seguir)

**P1. Bypass sistemático de RLS con `service_role_key`** — `src/app/actions/{aft,aulas,guardia}.ts` (45+ usos de `getAdminClient()`)
Todas las server actions abren un cliente con la **service role key** (que ignora RLS) y luego implementan el control de acceso en JS via `requireRole()`. Resultado: las políticas RLS escritas en SQL — que son tu segunda línea de defensa — están **muertas en la práctica**. Si un día se mete una server action mal escrita o un endpoint nuevo que olvide `requireRole`, no hay red de seguridad.
**Recomendación**: usar el cliente con sesión del usuario (`createClient` de `lib/supabase/server.ts`) salvo en operaciones que genuinamente requieran admin (alta de usuario, ediciones cross-organization). RLS ya está bien escrito — úsalo.

**P2. Endpoint público `/api/aft/sync` sin autenticación** — `src/app/api/aft/sync/route.ts`
El endpoint recibe `control_id` + `mbs[]` y marca activos como `escaneado=true` usando service_role_key. No verifica JWT, ni cookie de sesión, ni API key compartida. Cualquiera que descubra la URL puede manipular datos de control AFT.
**Recomendación**: verificar `Authorization: Bearer <jwt>` y delegar al action `syncScans()` (que sí valida con `requireAuth`). O al menos un secreto compartido (`X-Sync-Token`) entre la app móvil y la web.

**P3. Service role key expuesta previamente** — documentado en `AGENTS.md` Fase 0
El `.env.example` original tenía la `SUPABASE_SERVICE_ROLE_KEY` y la password de Postgres reales. Ya está sanitizado (commit `1f47aec`), pero **la rotación manual sigue pendiente** (acción nota en AGENTS.md). Mientras no se rote, esa key sigue siendo válida y está en el historial de git.

**P4. Política RLS abierta para `anon` en AFT** — `supabase/migrations/2026-06-03-aft-mobile-rls-anon.sql`
```sql
CREATE POLICY activos_aft_select_anon ON activos_aft FOR SELECT TO anon USING (true);
```
Esto expone **toda la tabla `activos_aft`** (controles, MBs, descripciones) a cualquiera con la `anon_key` (que va embebida en la app móvil y se ve en cualquier inspeccionar elemento web). Para un departamento pequeño y datos no muy sensibles es asumible, pero es una decisión que debe ser consciente.

---

### Altos

**P5. Patrón fetch en cliente repetido 18+ veces** — todas las páginas `(dashboard)/aft/*`, `guardia/*`, `aulas/*`
Cada página es `"use client"` con `useState/useEffect → createClient() → supabase.from(...)`. Esto:
- Mezcla server data con cliente sin necesidad (Next.js 16 + RSC permiten hacerlo en servidor).
- Hace una **doble lectura de perfil/rol** en cada página (provider + página).
- Pierde toda posibilidad de cache, prefetch y streaming SSR.
- Duplica lógica de loading/error.

**Recomendación**: convertir páginas de listado a Server Components (como ya está `dashboard/page.tsx` y `rrhh/page.tsx`). Mantener `"use client"` solo donde hay interactividad real (forms, tabs).

**P6. `organization_id` hardcodeado** — `src/app/actions/aulas.ts:208`
```ts
organization_id: "00000000-0000-0000-0000-000000000001",
```
El resto del código lee el `organization_id` del perfil del usuario; aquí está clavado. Si alguna vez se onboardea una segunda organización, esto rompe.

**P7. `console.log` y `console.error` en código de prod** — `src/components/aft/QrsPdfButton.tsx:107`, `src/app/api/aft/upload/route.ts:69`
Pequeñas filtraciones de información al cliente. No críticas, pero conviene reemplazar por un logger o silenciar.

**P8. Schema v1 obsoleto conviviendo con v2** — `supabase-schema.sql` aún define tablas `activos`, `movimientos_activos`, `detalles_control`, `incidencias`, `observaciones_guardia` que ya no se usan (el modelo activo es `areas_aft`/`controles_aft`/`activos_aft` + `guardia_*`). El `MEJORAS.md` mencionaba quitar stubs deprecados pero **ya no existen** en `actions/aft.ts` (sólo quedan referencias en `types/database.ts` y schemas Zod).
**Recomendación**: archivar las tablas v1 a un schema separado (`legacy.*`) o droppearlas tras migrar los datos que aún sirvan.

**P9. `alert()` / `confirm()` nativos en 18+ lugares** — todos los flujos de delete y errores en `aft/*`, `guardia/*`, `aulas/*`. UX bloqueante y feo. Toast system (sonner) sería un upgrade obvio (esto sigue pendiente del MEJORAS.md).

**P10. Doble fuente de auth helpers** — `src/lib/auth.ts` y `src/lib/auth/guard.ts` (no usado, pero existe). Confunde. Eliminar `guard.ts` o consolidar.

---

### Medios

**P11. 47 lint warnings de `any`** — declarados como "intencionales" en AGENTS.md por falta de tipos generados de Supabase.
**Recomendación**: ejecutar `npx supabase gen types typescript --project-id <id> > src/types/supabase.ts` una vez y eliminar el ruido. ROI alto: tipa todas las queries automáticamente.

**P12. Sin `next/dynamic` para librerías pesadas** — `jspdf` (~250KB) y `xlsx` (~700KB) se importan estáticamente en `QrsPdfButton.tsx` y en `actions/aft.ts`. Ya hay `await import("xlsx")` dinámico en actions (bien). Falta hacer lo propio para jsPDF/QRCode en cliente.

**P13. Paquetes en `package.json` que no son del repo** — `@types/pg` y `pg` en devDeps no se usan en src/. Prisma sigue en deps pero el ORM real es Supabase. Aunque MEJORAS.md menciona limpiar `recharts/date-fns/next-themes/@tanstack/react-table`, **ya no están** en `package.json` (la lista del MEJORAS.md está obsoleta). Lo que sí sigue: `prisma` dev, y scripts `db:pull/db:generate/db:push` que probablemente ya no se ejecutan.

**P14. Server actions sin try-catch unificado** — Cada action repite el mismo patrón `try/catch → return {success, error}`. Funciona, pero el manejo del error de Zod queda genérico (`(e as Error).message`) en vez de devolver los issues. Un helper `withActionResult()` ahorraría líneas y daría mensajes mejores.

**P15. `getGuardiaParte()` hace 3 queries secuenciales** — `actions/guardia.ts:228-271`. Posible optimización con un solo query + joins, pero el N es pequeño (1 parte, ~5 áreas, ~50 detalles). Aceptable hoy.

**P16. Sin paginación en historial AFT** — `aft/historial/page.tsx` trae **todos los controles** sin paginar. Con 100+ controles esto será un cuello de botella. Añadir `.range()` y filtros lazy.

**P17. SupabaseProvider hace SELECT a profiles dos veces** — `supabase-provider.tsx:30-34, 47-51`: una vez al montar, otra al `onAuthStateChange`. Aceptable, pero podría memoizarse.

**P18. `router.refresh()` después de auth en `login/page.tsx:36`** — funciona pero crea race conditions vistas en los E2E (timeout de 30s en login E2E documentado). Considerar `redirect()` server-side.

**P19. Cobertura E2E limitada** — solo 19 tests, ninguno cubre:
- Flujo con **discrepancias** Guardia (entrega ≠ recibo)
- Upload de Excel AFT
- Generación de PDF QRs
- Edición vs lectura como técnico no-dueño
- Sync móvil↔web

---

### Bajos / cosméticos

**P20. Comentarios "deprecados" en `types/database.ts`** — tipos `Activo`, `MovimientoActivo`, `ObservacionGuardia`, etc. del modelo v1 siguen exportados sin marcar como `@deprecated`.

**P21. `RoleGuard` se evalúa en cliente** — `src/components/RoleGuard.tsx`. Funciona pero es defense-in-depth débil: el usuario ya tiene los datos en el bundle JS. La verdadera defensa es la RLS + middleware. No es bug, sólo confunde el modelo mental.

**P22. Doble componente sidebar** — `src/components/sidebar.tsx` y `src/components/dashboard-chrome.tsx` (este último ya en uso). `sidebar.tsx` parece muerto. Eliminar.

**P23. Mensajes en español sin internacionalización** — todo el copy está hardcoded. Si en algún momento se exporta a otra facultad/universidad no-hispanohablante, hay que reescribir. No urgente.

**P24. Iconos como emojis** (📋 🔬 🏢 ✅) mezclados con lucide-react. Funciona en todos los browsers modernos, pero inconsistente.

**P25. Sin sitemap.xml ni robots.txt** — irrelevante para app interna, pero si Vercel se indexa accidentalmente, el SEO es nulo.

**P26. `tmp_cdp_landing.js` y `MEJORAS.md` están untracked** según `git status`. Limpiar o gitignorear.

**P27. `read-excel.js`, `seed-aft.js`, etc.** — 14 scripts debug en la raíz. Ya están gitignored (Fase 1) pero siguen en disco. Considerar moverlos a `scripts/debug/`.

**P28. `package.json` script `build: "next build"`** — confirma que ya se revirtió de `--webpack` (bien). Turbopack activo.

---

## 4. Plan de mejoras priorizado

Tabla de priorización con esfuerzo (S=horas, M=días, L=semanas), impacto y dependencias.

| # | Mejora | Severidad | Esfuerzo | Impacto | Dependencias |
|---|--------|-----------|----------|---------|-------------|
| **1** | Rotar `service_role_key` y password Postgres en Supabase | P3 | S | Crítico | Manual via dashboard |
| **2** | Proteger `/api/aft/sync` (JWT o shared secret) | P2 | S | Crítico | Coordinar con app móvil |
| **3** | Migrar server actions a cliente con sesión (eliminar `getAdminClient()` donde no haga falta) | P1 | M | Crítico | Verificar que RLS cubre cada caso |
| **4** | Limitar política RLS anon en `activos_aft` (filtrar por `control_id` y/o requerir JWT) | P4 | S | Alto | Coordinar app móvil |
| **5** | Convertir páginas de listado a Server Components (aft, guardia, aulas, historial) | P5 | M | Alto | Ninguna |
| **6** | Reemplazar `alert()/confirm()` por toast (`sonner`) | P9 | S | Medio (UX) | Instalar sonner |
| **7** | Generar tipos Supabase (`supabase gen types`) y eliminar `any` | P11 | S | Medio (DX) | Supabase CLI |
| **8** | Eliminar `organization_id` hardcoded en `iniciarSession` | P6 | S | Medio | Leer del perfil |
| **9** | Dynamic import de `jspdf` y `qrcode` en `QrsPdfButton` | P12 | S | Medio (bundle) | Ninguna |
| **10** | Eliminar `sidebar.tsx` muerto y `auth/guard.ts` duplicado | P10, P22 | S | Bajo (código) | Verificar no usado |
| **11** | Paginación en `aft/historial` (+ filtros server-side) | P16 | M | Medio | Ninguna |
| **12** | Tests E2E adicionales: discrepancias guardia, sync móvil, upload Excel | P19 | M | Alto (calidad) | Datos seed estables |
| **13** | Helper `withAction()` para uniformar try/catch + Zod issues | P14 | S | Bajo (DX) | Ninguna |
| **14** | Documentar/archivar schema v1 obsoleto (`activos`, `movimientos_activos`, etc.) | P8 | M | Bajo (mantenibilidad) | Decidir si migrar datos |
| **15** | Quitar `console.log/error` de prod, añadir logger condicional | P7 | S | Bajo | Ninguna |
| **16** | Limpiar deps no usadas (`pg`, `@types/pg`, `prisma` si no se usa) | P13 | S | Bajo (bundle) | Ninguna |
| **17** | Refactor `getGuardiaParte` a query única con joins | P15 | S | Bajo (perf) | Ninguna |
| **18** | i18n preparado (no traducir aún, sólo extraer strings) | P23 | M | Bajo (futuro) | Ninguna |
| **19** | Mover scripts debug raíz a `scripts/debug/` | P27 | S | Bajo (orden) | Ninguna |
| **20** | Empezar RRHH (stub → módulo real): trabajadores, horarios, prenóminas | — | L | Alto (negocio) | Decisión producto |

### Roadmap sugerido

**Sprint 1 — Seguridad (1 semana)**
Tareas #1, #2, #3, #4. Cerrar las puertas abiertas antes de cualquier otra cosa.

**Sprint 2 — Limpieza técnica (1 semana)**
Tareas #5, #7, #8, #10, #14, #15, #16, #19. Pagar la deuda mientras el contexto está fresco.

**Sprint 3 — UX y rendimiento (1 semana)**
Tareas #6, #9, #11, #13, #17. La app gana pulido y velocidad percibida.

**Sprint 4 — Calidad (1 semana)**
Tarea #12 (cobertura E2E ampliada). Reduce el riesgo antes del Sprint 5.

**Sprint 5+ — Nuevas features**
Tarea #20: RRHH. Antes de empezar, decidir si se necesitan también: filtros de fecha en historial guardia, exportar PDF del parte, notificaciones (todas mencionadas en AGENTS.md como "Next Steps").

---

## 5. Métricas observadas

- **LOC**: ~1.800 líneas en actions + lib + middleware. Tamaño manejable.
- **Tablas activas**: 20 (12 base + 5 AFT v2 + 5 Guardia v2). Otras 5 v1 obsoletas.
- **Migraciones**: 6 archivos en `supabase/migrations/` + schema base 1.325 líneas.
- **Páginas Next**: 24 client components, 2 server components (dashboard, rrhh). Desproporción evidente.
- **Tests E2E**: 19 (auth 9, guardia 2 serial, aulas 3, aft 5). 60s timeout, 0 retries.
- **Lint**: 47 warnings (todos `any`). 0 errores.
- **Build**: 22.9s con Turbopack en Vercel.

---

## 6. Conclusión

SITRADE es un **proyecto en buen estado para v1**: arquitectura razonable, deploy funcionando, tests pasando, RLS escrito (aunque underutilized), y un equipo (tú) que claramente documenta decisiones en `AGENTS.md`. La principal palanca de mejora a corto plazo es **endurecer la seguridad real** (no la cosmética del `requireRole`): apagar el bypass de RLS, cerrar el endpoint público, rotar la key expuesta. Después, refactor a Server Components para alinear con Next.js 16 y eliminar duplicación. Sólo entonces, abordar RRHH con base sólida.

Recomendación: ejecutar Sprint 1 completo sin saltarse la tarea #1 (rotación de credenciales).
