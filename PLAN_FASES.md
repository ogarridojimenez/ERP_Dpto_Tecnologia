# Plan de Solución por Fases — SITRADE ERP

**Fuente**: derivado del `INFORME_ANALISIS.md` (2026-06-16).
**Objetivo**: resolver los 28 problemas detectados (P1–P28) en un orden seguro, sin romper producción, priorizando seguridad → deuda técnica → UX/rendimiento → calidad → producto.
**Convención**: cada problema incluye **diagnóstico**, **archivos afectados**, **pasos concretos**, **código de referencia** y **verificación**.

---

## Índice de fases

| Fase | Nombre | Duración estimada | Problemas que cierra |
|------|--------|-------------------|----------------------|
| 0 | Preparación y baseline | ½ día | — (preflight) |
| 1 | Seguridad crítica | 1 semana | P1, P2, P3, P4 |
| 2 | Deuda técnica y limpieza | 1 semana | P5, P7, P8, P10, P11, P13, P15, P16, P22, P27, P28 |
| 3 | UX y rendimiento | 1 semana | P6, P9, P12, P14, P17, P18, P24 |
| 4 | Calidad y testing | ½ semana | P19 |
| 5 | Producto: RRHH y futuro | 2+ semanas | (P23 i18n + nuevo módulo) |
| 6 | Cosméticos y orden final | ½ día | P20, P21, P25, P26 |

---

## Fase 0 — Preparación y baseline

Antes de tocar nada, dejar el repo listo y reversible.

### 0.1 Crear rama de trabajo
```bash
git checkout -b refactor/plan-fases
git status   # verificar untracked: INFORME_ANALISIS.md, MEJORAS.md, tmp_cdp_landing.js
```

### 0.2 Snapshot del estado actual
- Ejecutar `npm run typecheck` y guardar la salida (47 warnings esperados, 0 errores).
- Ejecutar `npm run test:e2e` (19 tests) y confirmar verde.
- Tomar bundle size baseline: `npm run build` → anotar tamaño de la página `aft` y `dashboard`.

### 0.3 Crear archivo `CHANGES_PLAN.md` (opcional)
Un log de qué se va tocando por cada fase para facilitar el `git log` y los PRs incrementales.

---

## Fase 1 — Seguridad crítica (P1–P4)

**Regla de oro de esta fase**: cada cambio debe entrar a `main` con E2E verde y con la app móvil revalidada. Nada de "lo arreglo después".

---

### P3 — Rotar `service_role_key` y password Postgres expuestas

**Diagnóstico**: el `.env.example` original contenía la `SUPABASE_SERVICE_ROLE_KEY` y la password real de Postgres. Ya está sanitizado en código (commit `1f47aec`), pero **la key sigue siendo válida** porque el historial de git la conserva — cualquiera con acceso al repo (público o privado clonado) puede usarla.

**Por qué primero**: porque mientras no se rote, las demás mitigaciones de la Fase 1 no cierran el hueco real.

**Pasos**:
1. Entrar al dashboard de Supabase → **Project Settings → API**.
2. Click "Reset service_role key" → confirmar. Anotar la nueva key.
3. En **Database → Connection string**, cambiar la contraseña del rol `postgres`.
4. Actualizar variables en **Vercel** (`Project → Settings → Environment Variables`):
   - `SUPABASE_SERVICE_ROLE_KEY` ← nueva
   - `DATABASE_URL` / `POSTGRES_PASSWORD` ← nueva
5. Actualizar `.env.local` en cada máquina de desarrollo.
6. Re-deploy en Vercel (build + run nuevo).
7. Si la app móvil (`apps/mobile`) usa `EXPO_PUBLIC_*` que no son la `service_role` directamente, no cambia nada. Solo actualizar si referencia variables sensibles.

**Verificación**:
- `vercel logs` muestra arranque sin errores de auth a Supabase.
- Login y CRUDs funcionan en producción.
- Confirmar que la **key antigua ya no responde**: hacer un `curl` con la key vieja a la API REST de Supabase y debe devolver `401`.

**Nota**: dejar la key vieja documentada como "revocada el 2026-MM-DD" en `AGENTS.md` para auditoría.

---

### P2 — Proteger `/api/aft/sync` con autenticación

**Diagnóstico**: el endpoint en `src/app/api/aft/sync/route.ts` acepta `POST { control_id, mbs[] }` y marca activos como escaneados usando service_role. No exige JWT, cookie ni header. Cualquiera con la URL puede manipular datos.

**Estrategia recomendada**: validar `Authorization: Bearer <jwt>` del usuario autenticado en la app móvil, y delegar la lógica al server action `syncScans()` que **sí** valida con `requireAuth`. Fallback: `X-Sync-Token` (secreto compartido) para escenarios offline.

**Pasos**:

1. **Crear utilidad `verifyBearer(request)`** en `src/lib/auth/bearer.ts`:
   ```ts
   import { createClient } from "@supabase/supabase-js";
   import { NextRequest } from "next/server";

   export async function verifyBearer(request: NextRequest) {
     const auth = request.headers.get("authorization");
     if (!auth?.startsWith("Bearer ")) return null;
     const jwt = auth.slice(7);
     const supabase = createClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       { global: { headers: { Authorization: `Bearer ${jwt}` } } }
     );
     const { data, error } = await supabase.auth.getUser();
     if (error || !data?.user) return null;
     return { userId: data.user.id, supabase };
   }
   ```

2. **Reescribir** `src/app/api/aft/sync/route.ts`:
   ```ts
   export async function POST(request: NextRequest) {
     const session = await verifyBearer(request);
     if (!session) {
       return NextResponse.json({ error: "unauthorized" }, { status: 401 });
     }
     const body = await request.json();
     // delegar al action existente (que ya valida Zod + RLS)
     const result = await syncScansFor(session.userId, body);
     return NextResponse.json(result);
   }
   ```

3. **Actualizar la app móvil** (`apps/mobile`) para enviar el JWT en cada request:
   ```ts
   const { data: { session } } = await supabase.auth.getSession();
   await fetch(`${SYNC_URL}/api/aft/sync`, {
     method: "POST",
     headers: { Authorization: `Bearer ${session?.access_token}` },
     body: JSON.stringify({ control_id, mbs }),
   });
   ```

4. **Fallback `X-Sync-Token`** (opcional, para flujos no-Supabase):
   - Generar token aleatorio largo (`openssl rand -hex 32`).
   - Guardar en env `AFT_SYNC_TOKEN` (web) y en `EXPO_PUBLIC_*` o `expo-secure-store` (móvil).
   - Si no hay Bearer JWT, verificar `X-Sync-Token === process.env.AFT_SYNC_TOKEN`.

**Verificación**:
- `curl -X POST .../api/aft/sync` sin auth → 401.
- Con Bearer válido → 200, escaneo registrado.
- App móvil sigue sincronizando correctamente.
- Test E2E nuevo (ver Fase 4 P19) cubriendo este flujo.

---

### P4 — Limitar política RLS abierta para `anon` en `activos_aft`

**Diagnóstico**: la migración `2026-06-03-aft-mobile-rls-anon.sql` define:
```sql
CREATE POLICY activos_aft_select_anon ON activos_aft FOR SELECT TO anon USING (true);
```
La `anon_key` viaja en el bundle de la app móvil y es legible por cualquier visitante web. Esto expone **toda** la tabla.

**Estrategia**: dado que la app móvil necesita listar MBs por control para escanear, restringir SELECT por `control_id` activo (no eliminado). Mejor todavía: requerir JWT también en móvil y deprecar el rol `anon`.

**Pasos (opción A — endurecer, manteniendo anon)**:

1. Nueva migración `supabase/migrations/2026-06-16-aft-anon-restrict.sql`:
   ```sql
   DROP POLICY IF EXISTS activos_aft_select_anon ON activos_aft;

   CREATE POLICY activos_aft_select_anon_active
     ON activos_aft FOR SELECT TO anon
     USING (
       deleted_at IS NULL
       AND EXISTS (
         SELECT 1 FROM controles_aft c
         WHERE c.id = activos_aft.control_id
           AND c.deleted_at IS NULL
           AND c.estado = 'en_curso'
       )
     );
   ```
2. Probar app móvil: la query del scanner sólo verá MBs de controles abiertos.

**Estrategia (opción B — recomendada a medio plazo)**:
- Migrar la app móvil a autenticar con Supabase Auth (mismo backend) y eliminar el rol `anon`.
- Reemplazar `TO anon` por `TO authenticated USING (auth.uid() IS NOT NULL AND ...)`.
- Beneficio: traza de qué usuario escaneó qué MB.

**Verificación**:
- `supabase db lint` sin warnings.
- App móvil sigue listando MBs del control activo.
- Acceso anónimo a controles cerrados → vacío.

---

### P1 — Migrar server actions a cliente con sesión (eliminar `getAdminClient()` donde no haga falta)

**Diagnóstico**: 45+ usos de `getAdminClient()` (service_role) en `src/app/actions/{aft,aulas,guardia}.ts`. Esto **bypassa RLS** sistemáticamente — el control real depende de `requireRole()`. Si un día se olvida ese check, no hay defensa en profundidad.

**Estrategia**: usar el cliente con sesión del usuario (`createClient` de `src/lib/supabase/server.ts`) en todas las queries donde RLS ya cubre el caso. Reservar `getAdminClient()` sólo para:
- Alta de usuarios (`auth.admin.*`).
- Operaciones cross-organization (admin global).
- Triggers manuales que necesiten saltarse RLS conscientemente.

**Procedimiento (incremental, módulo por módulo)**:

1. **Auditar cada action**: listar todas las funciones de `actions/aft.ts`, `actions/aulas.ts`, `actions/guardia.ts` y marcar cuáles **realmente** necesitan service_role.

2. **Para cada función que NO lo necesita**:
   ```diff
   - const supabase = getAdminClient();
   + const supabase = await createClient(); // cliente con cookie de sesión
   ```
   El resto del código no cambia. RLS hará el filtrado.

3. **Verificar que RLS cubre cada operación**:
   - SELECT: existe policy `... FOR SELECT TO authenticated`.
   - INSERT/UPDATE/DELETE: existe policy `... FOR INSERT/UPDATE/DELETE`.
   - Si una policy falta, **añadirla** antes de cambiar el código (commit separado).

4. **Ejemplo concreto** — `actions/aft.ts → listAreas()`:
   ```diff
   export async function listAreas() {
   -  const supabase = getAdminClient();
   +  const supabase = await createClient();
     const { data, error } = await supabase
       .from("areas_aft")
       .select("*")
       .is("deleted_at", null);
     // ...
   }
   ```

5. **Caso especial — admin crea usuario**: mantener `getAdminClient()` pero documentar inline:
   ```ts
   // service_role REQUERIDO: auth.admin.createUser no es invocable con sesión normal
   const supabase = getAdminClient();
   ```

6. **Tests E2E como red de seguridad**: tras migrar cada módulo, re-correr `npm run test:e2e`. Si un test que antes pasaba ahora falla con `permission denied for table X` → falta una RLS policy.

**Estimación**: ~3 PRs, uno por módulo (aft / aulas / guardia). 1 día por módulo entre migración + test.

**Verificación**:
- Grep `getAdminClient(` debe pasar de ~45 a ≤5 usos justificados.
- E2E completo verde.
- Probar manualmente "técnico A intenta modificar registro de técnico B" → debe fallar por RLS, no por `requireRole`.

---

## Fase 2 — Deuda técnica y limpieza (P5, P7, P8, P10, P11, P13, P15, P16, P22, P27, P28)

Con la seguridad cerrada, saldar deuda mientras el contexto está fresco.

---

### P5 — Convertir páginas de listado a Server Components

**Diagnóstico**: 18 páginas `(dashboard)/{aft,guardia,aulas}/*` son `"use client"` con `useState/useEffect → supabase.from(...)`. Pierde SSR, cache, prefetch, streaming. Doble lectura de perfil/rol (provider + página).

**Estrategia**: convertir páginas de **listado** (`/aft`, `/guardia`, `/aulas`, `/aft/historial`, etc.) a Server Components. Mantener `"use client"` sólo para componentes interactivos (forms, tabs, modales).

**Patrón a aplicar** (ejemplo `aft/areas/page.tsx`):

```tsx
// ANTES (cliente)
"use client";
export default function Page() {
  const [areas, setAreas] = useState([]);
  useEffect(() => {
    createClient().from("areas_aft").select("*").then(({ data }) => setAreas(data || []));
  }, []);
  return <AreasTable areas={areas} />;
}

// DESPUÉS (servidor)
import { createClient } from "@/lib/supabase/server";
import { AreasTable } from "./areas-table"; // cliente, sólo si necesita interactividad

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data: areas } = await supabase.from("areas_aft").select("*").is("deleted_at", null);
  return <AreasTable areas={areas ?? []} />;
}
```

**Pasos por página**:
1. Renombrar `page.tsx` actual a `*-client.tsx` y dejarlo como componente interactivo.
2. Crear `page.tsx` server-side que carga datos y los pasa por props.
3. Mover server actions a `actions/*.ts` (ya están) y llamarlas con `useTransition`/`useFormStatus` desde el cliente.
4. Eliminar `useState`/`useEffect` de lectura inicial.

**Páginas prioritarias** (por tamaño de payload):
- `aft/historial/page.tsx` — listado pesado.
- `aft/areas/page.tsx`, `aft/controles/page.tsx`.
- `guardia/page.tsx`, `guardia/[fecha]/page.tsx`.
- `aulas/page.tsx`, `aulas/[sessionId]/page.tsx`.

**Verificación**:
- DevTools → Network: el HTML inicial ya contiene los datos (no hay segundo round-trip para fetch).
- `view-source` muestra la tabla renderizada.
- Tiempo de "primer contenido útil" baja notablemente en `aft/historial`.

---

### P16 — Paginación en historial AFT

**Diagnóstico**: `aft/historial/page.tsx` trae **todos** los controles sin paginar. Con 100+ controles se vuelve lento.

**Pasos**:
1. Aceptar query params `?page=1&size=20` en el server component.
2. Usar `.range(from, to)`:
   ```ts
   const page = Number(searchParams.page ?? 1);
   const size = 20;
   const from = (page - 1) * size;
   const to = from + size - 1;
   const { data, count } = await supabase
     .from("controles_aft")
     .select("*", { count: "exact" })
     .order("fecha", { ascending: false })
     .range(from, to);
   ```
3. Componente `<Pagination>` simple con `prev/next` y contador.
4. Filtros server-side (`fecha_from`, `fecha_to`, `estado`) por query params.

**Verificación**: con 200 registros seed, página `/aft/historial?page=2` muestra los siguientes 20. Lighthouse Performance mejora.

---

### P8 — Schema v1 obsoleto

**Diagnóstico**: `supabase-schema.sql` aún define `activos`, `movimientos_activos`, `detalles_control`, `incidencias`, `observaciones_guardia` (modelo v1). El modelo activo es v2 (`areas_aft`/`controles_aft`/`activos_aft` + `guardia_*`).

**Estrategia segura**: **no droppear** sin migrar datos. Pasos:

1. Decidir si las tablas v1 tienen datos en producción que valga la pena conservar.
   ```sql
   SELECT (SELECT count(*) FROM activos),
          (SELECT count(*) FROM movimientos_activos),
          (SELECT count(*) FROM detalles_control),
          (SELECT count(*) FROM incidencias),
          (SELECT count(*) FROM observaciones_guardia);
   ```
2. **Si hay datos valiosos**: migración 1 — copiar a `legacy.*`:
   ```sql
   CREATE SCHEMA IF NOT EXISTS legacy;
   ALTER TABLE public.activos SET SCHEMA legacy;
   -- ... resto
   ```
3. **Si no hay datos**: migración 2 — `DROP TABLE ... CASCADE`.
4. Actualizar `supabase-schema.sql` para reflejar el estado final.
5. Eliminar tipos obsoletos en `src/types/database.ts` (marcar `@deprecated` primero si rompe imports).

**Verificación**: `supabase db lint` sin errores. `npm run typecheck` verde. Las páginas v2 siguen funcionando.

---

### P22 — Componentes muertos

**Diagnóstico**: `src/components/sidebar.tsx` y `src/lib/auth/guard.ts` (duplicados de `dashboard-chrome.tsx` y `lib/auth.ts` respectivamente).

**Pasos**:
1. `grep -r "from .*components/sidebar" src/` — confirmar 0 imports.
2. `grep -r "from .*auth/guard" src/` — confirmar 0 imports.
3. `git rm src/components/sidebar.tsx src/lib/auth/guard.ts`.
4. `npm run typecheck` → debe pasar.

**Verificación**: build verde. Eliminar también `tmp_cdp_landing.js` (untracked, según `git status`).

---

### P13 — Limpiar deps no usadas (`pg`, `@types/pg`, `prisma`)

**Diagnóstico**: `package.json` tiene `pg`, `@types/pg` en devDeps y `prisma` (+ scripts `db:pull/db:generate/db:push`) que no se usan: el ORM real es Supabase.

**Pasos**:
1. Confirmar 0 imports: `grep -r "from 'pg'" src/`, `grep -r "from '@prisma" src/`.
2. Si existe carpeta `prisma/`, archivarla (`git mv prisma _archive/prisma`) o borrarla.
3. ```bash
   npm uninstall pg @types/pg prisma @prisma/client
   ```
4. Eliminar scripts en `package.json`: `db:pull`, `db:generate`, `db:push`.
5. Reinstalar para regenerar `package-lock.json`.

**Verificación**: `npm run typecheck`, `npm run build`, `npm run test:e2e` verdes. Bundle no debe cambiar (eran devDeps), pero `node_modules` baja ~50–80MB.

---

### P11 — Generar tipos Supabase y eliminar `any`

**Diagnóstico**: 47 lint warnings de `any` por falta de tipos generados.

**Pasos**:
1. Tener Supabase CLI logueado: `npx supabase login`.
2. Ejecutar:
   ```bash
   npx supabase gen types typescript --project-id <PROJECT_ID> --schema public > src/types/supabase.ts
   ```
3. En `src/lib/supabase/server.ts` y `client.ts`, tipar el cliente:
   ```ts
   import type { Database } from "@/types/supabase";
   export async function createClient() {
     return createServerClient<Database>(...);
   }
   ```
4. Reemplazar `any` por tipos concretos:
   ```diff
   - const { data } = await supabase.from("areas_aft").select("*");
   - const areas: any[] = data || [];
   + const { data } = await supabase.from("areas_aft").select("*");
   + const areas = data ?? []; // ahora inferido como Database["public"]["Tables"]["areas_aft"]["Row"][]
   ```
5. **Automatizar**: añadir script `npm run gen:types` y un workflow CI opcional que falla si los tipos están desactualizados.

**Verificación**: `npm run lint` debe pasar de 47 warnings a <5. Autocompletado de campos en VS Code en queries Supabase.

---

### P15 — Refactor `getGuardiaParte` (perf marginal)

**Diagnóstico**: `actions/guardia.ts:228-271` hace 3 queries secuenciales (parte + áreas + detalles). Aceptable hoy, pero unificable.

**Pasos** (sólo si la Fase 2 sobra tiempo):
```ts
const { data, error } = await supabase
  .from("partes_guardia")
  .select(`
    *,
    areas_guardia ( *,
      detalles_guardia ( * )
    )
  `)
  .eq("id", parteId)
  .single();
```

**Verificación**: latencia de la página de detalle baja de ~3 round-trips a 1. E2E sigue verde.

---

### P10 — Doble fuente de auth helpers

**Diagnóstico**: existen `src/lib/auth.ts` (en uso) y `src/lib/auth/guard.ts` (no usado). Confunde el modelo mental.

**Pasos**: cubierto en P22 (eliminar `guard.ts`).

---

### P27 — Mover scripts debug a `scripts/debug/`

**Diagnóstico**: 14 scripts en la raíz (`read-excel.js`, `seed-aft.js`, etc.) gitignored pero en disco.

**Pasos**:
1. `mkdir -p scripts/debug`.
2. Mover los `.js` raíz que sean debug:
   ```bash
   git mv read-excel.js seed-aft.js ... scripts/debug/
   ```
   (sólo los que no estén gitignored; si están ignored, `mv` normal).
3. Si referencian rutas relativas, ajustar imports.
4. Documentar en `AGENTS.md` que `scripts/debug/` contiene helpers locales.

**Verificación**: raíz limpia. Scripts siguen ejecutándose con `node scripts/debug/<nombre>.js`.

---

### P28 — `package.json` script `build`

**Diagnóstico**: el informe confirma que ya se revirtió de `--webpack` a `next build`. **Sólo verificar**.

**Pasos**:
```bash
grep '"build"' package.json
# debe ser: "build": "next build"
```
Si por algún motivo volviera a tener `--webpack`, revertir.

---

## Fase 3 — UX y rendimiento (P6, P9, P12, P14, P17, P18, P24)

---

### P9 — Reemplazar `alert()`/`confirm()` por toasts + diálogos

**Diagnóstico**: 18+ usos de `alert()`/`confirm()` nativos. UX bloqueante y feo.

**Pasos**:

1. Instalar `sonner`:
   ```bash
   npm install sonner
   ```
2. Añadir `<Toaster>` en `src/app/(dashboard)/layout.tsx`:
   ```tsx
   import { Toaster } from "sonner";
   // ...
   <Toaster position="top-right" richColors closeButton />
   ```
3. Crear `src/components/ui/confirm-dialog.tsx` (Radix Dialog o headlessui) para reemplazar `confirm()`:
   ```tsx
   export function ConfirmDialog({ title, description, onConfirm, children }) {
     // diálogo accesible con foco trampa
   }
   ```
4. Reemplazos sistemáticos:
   ```diff
   - if (!confirm("¿Eliminar?")) return;
   - const result = await deleteX(id);
   - if (result.error) alert(result.error);
   - else alert("Eliminado");
   + // delete handler dentro de ConfirmDialog onConfirm
   + const result = await deleteX(id);
   + if (result.error) toast.error(result.error);
   + else toast.success("Eliminado");
   ```
5. Archivos a barrer (grep `alert(\|confirm(`):
   - `guardia/page.tsx`, `guardia/config/page.tsx`
   - `aft/areas/page.tsx`, `aft/controles/[id]/page.tsx`
   - `aulas/[sessionId]/page.tsx`
   - Cualquier otro hit.

**Verificación**: ningún `alert(`/`confirm(` en `src/`. Probar delete en cada módulo: toast visible, sin diálogos nativos.

---

### P12 — Dynamic imports de librerías pesadas

**Diagnóstico**: `jspdf` (~250KB) y `qrcode` se importan estáticamente en `QrsPdfButton.tsx`. El bundle de la página AFT lleva esa carga aunque el usuario nunca pulse "Generar PDF".

**Pasos**:

```tsx
// src/components/aft/QrsPdfButton.tsx
"use client";
import { useState } from "react";

export function QrsPdfButton({ data }) {
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    const [{ jsPDF }, QRCode] = await Promise.all([
      import("jspdf"),
      import("qrcode"),
    ]);
    // ... resto igual
    setLoading(false);
  }

  return <button onClick={handleGenerate} disabled={loading}>...</button>;
}
```

`xlsx` en `actions/aft.ts` ya está dinámico (mantener).

**Verificación**: `npm run build` → tamaño de `aft/[id]` baja ~300KB. DevTools → Network: `jspdf-*.js` sólo se carga al hacer click.

---

### P14 — Helper `withAction()` para uniformar try/catch

**Diagnóstico**: cada server action repite `try/catch → return {success, error}`. El manejo de error Zod queda genérico (`(e as Error).message`) en lugar de devolver issues.

**Pasos**:

1. Crear `src/lib/actions/with-action.ts`:
   ```ts
   import { ZodError, ZodSchema } from "zod";

   type ActionResult<T> =
     | { success: true; data: T }
     | { success: false; error: string; issues?: ZodError["issues"] };

   export async function withAction<T, I>(
     schema: ZodSchema<I>,
     input: unknown,
     fn: (parsed: I) => Promise<T>
   ): Promise<ActionResult<T>> {
     const parsed = schema.safeParse(input);
     if (!parsed.success) {
       return {
         success: false,
         error: "Datos inválidos",
         issues: parsed.error.issues,
       };
     }
     try {
       const data = await fn(parsed.data);
       return { success: true, data };
     } catch (e) {
       return { success: false, error: (e as Error).message };
     }
   }
   ```

2. Refactor de actions, ejemplo `saveEntrega`:
   ```ts
   export async function saveEntrega(input: unknown) {
     return withAction(entregaSchema, input, async (data) => {
       await requireRole(...);
       const supabase = await createClient();
       const { error } = await supabase.from("entregas").upsert(data);
       if (error) throw new Error(error.message);
       revalidatePath("/guardia");
       return { id: data.id };
     });
   }
   ```

3. En cliente, mostrar issues:
   ```tsx
   if (!result.success && result.issues) {
     result.issues.forEach((i) => toast.error(`${i.path.join(".")}: ${i.message}`));
   }
   ```

**Verificación**: actions con error de validación devuelven `issues` detallados. Toasts indican el campo concreto.

---

### P17 — SupabaseProvider doble SELECT a profiles

**Diagnóstico**: `supabase-provider.tsx` hace SELECT a `profiles` dos veces (montaje + `onAuthStateChange`). Aceptable, pero memoizable.

**Pasos**:
1. Mantener una sola fuente — usar `onAuthStateChange` para todo:
   ```tsx
   useEffect(() => {
     const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
       if (!session) { setProfile(null); return; }
       const { data: profile } = await supabase
         .from("profiles").select("*").eq("id", session.user.id).single();
       setProfile(profile);
     });
     return () => data.subscription.unsubscribe();
   }, []);
   ```
   `onAuthStateChange` dispara también con la sesión inicial (`INITIAL_SESSION`), evitando la doble query.

**Verificación**: DevTools → Network: 1 sola query a `profiles` por sesión.

---

### P18 — `router.refresh()` después de login crea race conditions

**Diagnóstico**: `login/page.tsx:36` usa `router.refresh()` tras `signInWithPassword`. Esto causa timeouts E2E de 30s.

**Pasos**:
1. Reescribir login como **server action** + `redirect()`:
   ```tsx
   // src/app/(auth)/login/actions.ts
   "use server";
   import { redirect } from "next/navigation";
   import { createClient } from "@/lib/supabase/server";

   export async function loginAction(formData: FormData) {
     const supabase = await createClient();
     const { error } = await supabase.auth.signInWithPassword({
       email: String(formData.get("email")),
       password: String(formData.get("password")),
     });
     if (error) return { error: error.message };
     redirect("/dashboard");
   }
   ```
2. En `page.tsx`, usar `<form action={loginAction}>` + `useFormState` para errores.
3. La redirección server-side evita la race condition (la cookie ya está set antes del navegar).

**Verificación**: E2E de login pasa estable a <5s. Quitar el timeout extendido a 30s.

---

### P24 — Iconos como emojis vs `lucide-react`

**Diagnóstico**: emojis (📋 🔬 🏢 ✅) mezclados con `lucide-react`. Inconsistente.

**Pasos**:
1. Inventario rápido: `grep -nP "[📋🔬🏢✅📦📊🔔]" src/` (ajustar a los emojis encontrados).
2. Reemplazar por `<Icon name="clipboard"/>`, `<Icon name="flask-conical"/>`, etc. de lucide.
3. Mantener emojis sólo en strings de copy (mensajes hacia el usuario), no en UI estructural.

**Verificación**: visualmente consistente, mismo grosor de trazo y color por contexto.

---

### P6 — `console.log/error` en producción

**Diagnóstico**: ya está nombrado en MEJORAS.md, asignado a esta fase porque es UX/pulido.

**Pasos**:
1. Crear `src/lib/logger.ts`:
   ```ts
   const isDev = process.env.NODE_ENV !== "production";
   export const logger = {
     log: (...args: unknown[]) => { if (isDev) console.log(...args); },
     warn: (...args: unknown[]) => { if (isDev) console.warn(...args); },
     error: (...args: unknown[]) => console.error(...args), // siempre
   };
   ```
2. Reemplazar:
   ```diff
   - console.log("..."); // QrsPdfButton.tsx:107
   + logger.log("...");
   ```
3. Para errores que vayan a un servicio (Sentry, Logflare), conectar aquí.

**Verificación**: `grep "console.log" src/` → 0 hits. `grep "console.error" src/` → solo en `logger.ts`.

---

## Fase 4 — Calidad y testing (P19)

---

### P19 — Cobertura E2E ampliada

**Diagnóstico**: 19 tests cubren auth/aft/aulas/guardia básicos. Faltan flujos críticos.

**Tests a añadir** (en `tests/e2e/`):

1. **`guardia-discrepancias.spec.ts`** — entrega con conteo ≠ recibo:
   ```ts
   // técnico A registra entrega con 10 mouse
   // técnico B (siguiente turno) registra recibo con 9 mouse
   // verificar: parte muestra discrepancia y registra incidencia
   ```

2. **`aft-upload-excel.spec.ts`** — admin sube Excel con N filas:
   ```ts
   // login como admin
   // ir a /aft/controles/nuevo, adjuntar fixture .xlsx
   // verificar: N filas insertadas en activos_aft, mensaje de éxito
   ```

3. **`aft-pdf-qr.spec.ts`** — generación de PDF:
   ```ts
   // ir a /aft/controles/[id], pulsar "Generar PDF"
   // esperar download, verificar nombre y tamaño > 0
   ```

4. **`role-non-owner.spec.ts`** — técnico no puede editar registro ajeno:
   ```ts
   // técnico A crea entrega
   // login técnico B → abrir entrega → botón "Editar" deshabilitado o 403
   ```

5. **`mobile-sync.spec.ts`** — sync móvil→web con JWT:
   ```ts
   // simular request POST /api/aft/sync con Bearer válido
   // verificar: activos_aft.escaneado = true
   // request sin Bearer → 401
   ```

**Datos seed estables**:
- Crear `tests/e2e/fixtures/seed.sql` con: 2 usuarios, 1 organización, 1 área AFT, 1 control con 5 MBs.
- Script `npm run e2e:seed` que limpia y reaplica antes de la suite.

**Verificación**: `npm run test:e2e` pasa con 24+ tests. CI verde.

---

## Fase 5 — Producto: RRHH y futuro

---

### Empezar módulo RRHH (depende de decisión de producto)

**Pasos** (alto nivel):

1. **Modelar entidades** (ya hay tablas vacías): `trabajadores`, `horarios`, `prenominas`, `categorias_salariales`, `historial_salarial`. Validar el esquema con un compañero de RRHH antes de codear.
2. **Server actions** en `src/app/actions/rrhh.ts` con la misma convención (Zod, `requireRole("rrhh"|"admin")`, `revalidatePath`).
3. **Páginas Server Component** (siguiendo P5):
   - `/rrhh/trabajadores` — listado + filtros.
   - `/rrhh/horarios` — calendar view (considerar `fullcalendar` o construir simple).
   - `/rrhh/prenominas` — generación mensual.
4. **Tests E2E** mínimos por flujo (alta trabajador, cálculo prenómina).
5. **Permisos**: el rol `rrhh` puede CRUD; `admin` igual; otros sólo lectura agregada.

**Pre-requisito**: Sprint 1 + 2 cerrados (no abrir nuevo módulo encima de deuda técnica).

---

### P23 — i18n preparado (no traducir todavía)

**Diagnóstico**: todo el copy hardcoded en español. No urgente, pero conviene extraer.

**Pasos**:
1. Instalar `next-intl` o `i18next`.
2. Extraer strings a `src/i18n/locales/es.json`.
3. Wrapper `<I18nProvider locale="es">` en root layout.
4. Reemplazar literales: `t("guardia.titulo")`.
5. **No traducir** todavía: dejar sólo `es.json` poblado, `en.json` vacío. La infraestructura queda lista para añadir idiomas sin tocar JSX.

**Verificación**: `npm run typecheck` verde. UI sin cambios visibles.

---

## Fase 6 — Cosméticos y orden final (P20, P21, P25, P26)

---

### P20 — Marcar tipos v1 como `@deprecated`

```diff
+ /** @deprecated Modelo v1. Usar Activo_aft. Se eliminará en v3. */
  export type Activo = { ... };
```
Si Fase 2 ya eliminó las tablas, eliminar también estos tipos. Si quedaron en `legacy.*`, marcar.

---

### P21 — `RoleGuard` como defensa cosmética

**Acción**: documentar inline en `src/components/RoleGuard.tsx`:
```tsx
/**
 * Oculta UI según rol — defensa COSMÉTICA, no de seguridad.
 * La seguridad real vive en: middleware → requireRole en actions → RLS.
 * Si necesitas seguridad de verdad, no confíes en este componente.
 */
```

---

### P25 — `robots.txt` para evitar indexación

Crear `src/app/robots.ts`:
```ts
import { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
```

**Verificación**: `curl https://sitrade.vercel.app/robots.txt` → `User-agent: *\nDisallow: /`.

---

### P26 — Limpiar untracked

```bash
git rm tmp_cdp_landing.js 2>/dev/null || rm tmp_cdp_landing.js
```
Decidir qué hacer con `INFORME_ANALISIS.md`, `MEJORAS.md`, `PLAN_FASES.md`:
- Si son docs vivas → añadir al repo (`git add docs/` o raíz).
- Si son scratch → añadir a `.gitignore`.

---

## Resumen ejecutivo

| Fase | Cierre | Riesgo si se omite |
|------|--------|---------------------|
| 0 | Baseline + rama dedicada | Cambios sin rollback claro |
| 1 | Seguridad real (no cosmética) | Bypass RLS + endpoint público + key expuesta |
| 2 | Deuda técnica saldada | Imposible escalar a RRHH sin pagar deuda |
| 3 | UX consistente y bundle ligero | Frustración usuario + Lighthouse rojo |
| 4 | Confianza para refactorizar | Regresiones invisibles |
| 5 | RRHH operativo | Stub sigue siendo placeholder |
| 6 | Higiene final | Confusión y polución del repo |

**Camino crítico**: **Fase 1 es bloqueante** para todo lo demás. Las fases 2 y 3 son paralelizables si hay >1 dev. Fase 4 valida fases 2-3. Fase 5 sólo arranca tras Fase 2 cerrada.

**Métricas de éxito al final**:
- 0 `getAdminClient()` en server actions de lectura.
- 0 endpoints sin auth.
- 24+ tests E2E pasando.
- <5 warnings de `any`.
- Bundle de `aft/[id]` reducido ≥250KB.
- Tablas v1 archivadas o eliminadas.
- 0 `alert()`/`confirm()` nativos.
