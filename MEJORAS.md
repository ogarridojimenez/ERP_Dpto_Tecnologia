# Plan de Mejoras — SITRADE ERP

Generado: 2026-06-07 basado en análisis completo del proyecto.

---

## Priorización

| # | Mejora | Área | Esfuerzo | Impacto | Riesgo | Dependencias |
|---|--------|------|----------|---------|--------|-------------|
| 1 | Error Boundaries (`error.tsx`) | Resiliencia | Bajo | Alto | Bajo | Ninguna |
| 2 | Loading states + Skeleton componentes | UX | Bajo | Alto | Bajo | Ninguna |
| 3 | Toast system (reemplazar `alert()`) | UX | Medio | Medio | Bajo | Instalar `sonner` |
| 4 | Limpiar 5 paquetes no usados | Bundle | Bajo | Medio | Bajo | Ninguna |
| 5 | Hook `useSupabaseQuery` reusable | Código | Medio | Medio | Bajo | Ninguna |
| 6 | Fix font preload 404 | Rendimiento | Bajo | Bajo | Bajo | Ninguna |
| 7 | Turbopack build (revertir `--webpack`) | Build | Bajo | Medio | Bajo | Ninguna |
| 8 | Eliminar stubs AFT v1 deprecados | Código | Bajo | Bajo | Bajo | Ninguna |
| 9 | autoComplete en login form | UX | Mínimo | Bajo | Bajo | Ninguna |
| 10 | Centralizar schemas Zod | Código | Bajo | Bajo | Bajo | Ninguna |
| 11 | Scrollbar-gutter en mobile sidebar | UI | Mínimo | Bajo | Bajo | Ninguna |
| 12 | Ejecutar E2E con `next start` (no dev server) | Testing | Bajo | Medio | Bajo | CI / script |

---

## 1. Error Boundaries (`error.tsx`)

**Problema**: 0 archivos `error.tsx` en el proyecto. Cualquier error de renderizado produce pantalla en blanco o "Application Error" de Next.js.

**Solución**: Crear archivos `error.tsx` en cada ruta protegida.

**Archivos a crear:**

| Ruta | Archivo |
|------|---------|
| Raíz dashboard | `src/app/(dashboard)/error.tsx` |
| Guardia | `src/app/(dashboard)/guardia/error.tsx` |
| AFT | `src/app/(dashboard)/aft/error.tsx` |
| Aulas | `src/app/(dashboard)/aulas/error.tsx` |
| RRHH | `src/app/(dashboard)/rrhh/error.tsx` |

**Contenido típico por archivo:**
```tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-xl font-bold text-red-700">Algo salió mal</h2>
      <p className="mt-2 text-sm text-gray-500">
        {error.message || "Error inesperado"}
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
      >
        Reintentar
      </button>
    </div>
  );
}
```

**Verificación**: Navegar a la ruta y forzar error. Debe mostrar UI amigable con botón "Reintentar".

---

## 2. Loading States + Skeleton

**Problema**: 18 páginas repiten patrón manual `useState(true)/useEffect/setLoading(false)` con `<div>Cargando...</div>` texto plano. No hay archivos `loading.tsx` (Suspense boundaries automáticos).

**Solución**: Añadir `loading.tsx` y componente `<Skeleton>` compartido.

### 2a. Componente Skeleton compartido

**Archivo a crear:** `src/components/ui/skeleton.tsx`

```tsx
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
    />
  );
}
```

**Uso en páginas:**
```tsx
{loading ? (
  <div className="space-y-4">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-32 w-full" />
  </div>
) : (
  /* contenido real */
)}
```

### 2b. Archivos `loading.tsx`

**Archivos a crear:**

| Ruta | Archivo |
|------|---------|
| Dashboard | `src/app/(dashboard)/loading.tsx` |
| Guardia list | `src/app/(dashboard)/guardia/loading.tsx` |
| AFT list | `src/app/(dashboard)/aft/loading.tsx` |
| Aulas list | `src/app/(dashboard)/aulas/loading.tsx` |

**Contenido típico:**
```tsx
export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-64 animate-pulse rounded-md bg-gray-200" />
      <div className="h-32 w-full animate-pulse rounded-md bg-gray-200" />
    </div>
  );
}
```

**Verificación**: Cargar ruta lentamente (throttle network). Debe mostrar skeleton inmediatamente.

---

## 3. Toast System (reemplazar `alert()`)

**Problema**: Delete flows usan `confirm()` + `alert()` nativos del browser. UX pobre, bloqueante, sin estilo.

**Solución**: Instalar biblioteca de toasts y reemplazar todos los `alert()`.

### Instalación
```bash
npm uninstall recharts @tanstack/react-table date-fns next-themes @prisma/client
npm install sonner
```

### Provider en layout
```diff
// src/app/(dashboard)/layout.tsx
+ import { Toaster } from "sonner";
<SupabaseProvider>
+   <Toaster position="top-right" richColors />
  <DashboardChrome>{children}</DashboardChrome>
</SupabaseProvider>
```

### Reemplazar `alert()` en:
- `guardia/page.tsx:40` — `alert(result.error || "Error al eliminar")`
- `guardia/config/page.tsx:53` — `alert((result as any).error || "Error al crear area")`
- `aft/areas/page.tsx` — delete error
- `aulas/[sessionId]/page.tsx` — delete error
- Cualquier otro `alert()` en el código

**Patrón de reemplazo:**
```diff
- alert(result.error || "Error al eliminar");
+ toast.error(result.error || "Error al eliminar");
```

**Verificación**: Probar delete flow en guardia, aft, aulas. Debe mostrar toast en vez de alert.

---

## 4. Limpiar Paquetes No Usados

**Problema**: 5 paquetes en `dependencies` que no se importan en el código fuente.

| Paquete | Tamaño estimado | Razón para quitar |
|---------|----------------:|-------------------|
| `@tanstack/react-table` | ~30KB | No importado en ningún archivo |
| `recharts` | ~150KB | No importado en ningún archivo |
| `date-fns` | ~20KB | Se usa `Intl.DateTimeFormat` nativo |
| `next-themes` | ~5KB | No usado; modo oscuro no implementado |
| `@prisma/client` | ~sendero | ORM no usado; backend es Supabase |

**Comando:**
```bash
npm uninstall @tanstack/react-table recharts date-fns next-themes @prisma/client
```

**Verificación**: `npm run typecheck` y `npm run build` pasan sin errores.

---

## 5. Hook `useSupabaseQuery` Reusable

**Problema**: 18 páginas repiten el patrón `useState + useEffect + setLoading(false)`. Código duplicado y propenso a errores (falta manejo de error, sin cleanup, sin caching).

**Solución**: Hook centralizado.

**Archivo a crear:** `src/hooks/useSupabaseQuery.ts`

```tsx
import { useState, useEffect } from "react";

export function useSupabaseQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (mounted) setData(result);
      })
      .catch((e) => {
        if (mounted) setError((e as Error).message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
```

**Migración típica:**
```diff
// Antes (18 archivos):
- const [areas, setAreas] = useState<any[]>([]);
- const [loading, setLoading] = useState(true);
- useEffect(() => {
-   const supabase = createClient();
-   supabase.from("areas_aft").select("*").then(({ data }) => {
-     if (data) setAreas(data);
-     setLoading(false);
-   });
- }, []);

// Después:
+ import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
+ const { data: areas, loading } = useSupabaseQuery(async () => {
+   const supabase = createClient();
+   const { data } = await supabase.from("areas_aft").select("*");
+   return data || [];
+ });
```

**Verificación**: Cada página migrada debe mantener mismo comportamiento.

---

## 6. Fix Font Preload 404

**Problema**: En producción, Next.js genera preloads para fuentes Geist que devuelven 404:
```
<link rel=preload href=".../797e433ab948586e-s.p.09zddjkbdep5a.woff2" as="font" crossorigin="">
<link rel=preload href=".../caa3a2e1cccd8315-s.p.09~u27dqhyhd6.woff2" as="font" crossorigin="">
```

Estos archivos no existen en `.next/static/media/`. La fuente real se carga por otra ruta.

**Solución**: Reescribir la importación de fuentes en `src/app/layout.tsx`.

**Antes:**
```tsx
import { Geist, Geist_Mono } from "next/font/google";
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
```

**Después:**
```tsx
import localFont from "next/font/local";
const geistSans = localFont({
  src: "./fonts/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});
```

O simplemente actualizar a la sintaxis más reciente de `next/font/google` que corrige los preloads.

**Verificación**: `curl` el HTML de la landing page. No debe tener preloads 404. Lighthouse Performance no debe mostrar advertencia de fuentes.

---

## 7. Turbopack Build

**Problema**: `package.json` usa `next build --webpack` como workaround de un bug en `@vercel/next@4.17.2`. Con Vercel CLI 54.9.1 + `@vercel/next@4.17.5`, el bug está resuelto.

**Solución**: Revertir a `next build` para usar Turbopack (builds más rápidos).

```diff
- "build": "next build --webpack",
+ "build": "next build",
```

**Verificación**: `npm run build` pasa. Deploy en Vercel pasa. Las rutas dinámicas (force-dynamic) funcionan.

---

## 8. Eliminar Stubs AFT v1

**Problema**: `src/app/actions/aft.ts` contiene 6 funciones deprecadas que son stubs vacíos:
- `createActivo()` — no hace nada
- `updateActivo()` — no hace nada
- `deleteActivo()` — no hace nada
- `moveActivo()` — no hace nada
- `runReconciliation()` — lanza error
- `syncInventoryScans()` — lanza error

Ninguna se importa en el frontend. El modelo activo es AFT v2 (áreas/controles/activos_aft).

**Solución**: Eliminar las 6 funciones (~60 líneas).

**Verificación**: `npm run typecheck` y `npm run build` pasan. Página `/aft` y subrutas funcionan.

---

## 9. autoComplete en Login

**Problema**: El campo de password en `/login` no tiene `autoComplete`, forzando al browser a no sugerir la contraseña guardada.

**Solución**: 1 línea en `src/app/(auth)/login/page.tsx`:

```diff
<input
  type="password"
+ autoComplete="current-password"
  ...
/>
```

**Verificación**: Login funciona. Browser sugiere contraseña guardada.

---

## 10. Centralizar Schemas Zod

**Problema**: Schemas compartidos (como `uuidSchema`) están dentro de `src/lib/schemas/aft.ts`. Si otro módulo los necesita, debe importar de un archivo de otro módulo.

**Solución**: Crear punto de entrada compartido.

**Archivo a crear:** `src/lib/schemas/index.ts`

```tsx
export { uuidSchema } from "./aft";
```

O mover `uuidSchema` a `index.ts` directamente.

**Verificación**: Los imports existentes siguen funcionando.

---

## 11. Scrollbar-gutter en Mobile Sidebar

**Problema**: `DashboardChrome` usa `overflow: hidden` en `<body>` al abrir el sidebar mobile, causando layout shift (el contenido se desplaza cuando desaparece el scrollbar).

**Solución**: En lugar de `overflow: hidden`, aplicar `scrollbar-gutter: stable`:

```diff
- document.body.style.overflow = "hidden";
+ document.body.style.scrollbarGutter = "stable";
```

**Verificación**: Abrir sidebar mobile en viewport estrecho. El contenido no debe desplazarse.

---

## 12. E2E con `next start` (Producción)

**Problema**: La suite E2E completa falla intermitentemente bajo dev server. Dev server se degrada con carga secuencial de tests.

**Solución**: Script `test:e2e:ci` que build + sirve en producción:

```json
{
  "scripts": {
    "test:e2e:ci": "npm run build && npx playwright test"
  }
}
```

**Verificación**: `npm run test:e2e:ci` pasa completo con servidor de producción.

---

## Notas Adicionales

### Sobre E2E Flakiness
El único failure conocido es timeout de Supabase auth (>30s) bajo carga del dev server. Con `next start` (producción) el servidor responde más rápido. Si persiste, aumentar timeout a 45s en `helpers/auth.ts`.

### Sobre los 47 lint errors
Todos son `@typescript-eslint/no-explicit-any` en queries Supabase y parsing JSON. Son intencionales (no hay tipos generados para las tablas de Supabase). Si en el futuro se añade `supabase gen types`, se pueden reemplazar con los tipos generados.

### Sobre RRHH
El stub está listo. Al empezar desarrollo, considerar crear `actions/rrhh.ts` con las mismas convenciones que los otros módulos (Zod, requireRole, revalidatePath).

### Sobre Sync Móvil
El endpoint `/api/aft/sync` usa service role key directa (no session auth). Para producción, considerar agregar verificación de token JWT o API key compartida.
