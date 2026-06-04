# SITRADE — Plan de Implementación por Fases

## Fase 1 — Guardia (Pase de Guardia)

**Objetivo**: Digitalizar el parte de guardia con entrega/recibo por locales.

**Modelos involucrados**: `Guardia`, `ObservacionGuardia`, `Incidencia`

| # | Tarea | Archivos |
|---|-------|----------|
| 1 | Server actions — CRUD de guardias, crear/cerrar guardia, guardar observaciones por local | `src/app/actions/guardia.ts` |
| 2 | Zod schemas — Validación de turno, observaciones por local (PC, periféricos, cables) | `src/lib/schemas/guardia.ts` |
| 3 | Página: Listado de guardias — Tabla con filtro por fecha/turno/estado, botón "Nueva guardia" | `src/app/(dashboard)/guardia/page.tsx` |
| 4 | Página: Nueva guardia — Seleccionar turno (matutino/vespertino), genera registros para cada locale activo | `src/app/(dashboard)/guardia/nueva/page.tsx` |
| 5 | Página: Detalle de guardia — Panel con dos modos: "Entrega" y "Recibo". Lista de locales con estado | `src/app/(dashboard)/guardia/[id]/page.tsx` |
| 6 | Página: Revisar local en guardia — Formulario por local con estado de PCs, periféricos, cables, observaciones | `src/app/(dashboard)/guardia/[id]/[localeId]/page.tsx` |
| 7 | Botón eliminar guardia | Componente inline en listado |

---

## Fase 2 — Activos Fijos Tangibles (AFT)

**Objetivo**: Inventario, control periódico y movimientos de activos fijos.

**Modelos involucrados**: `Activo`, `MovimientoActivo`, `ControlAft`, `DetalleControl`

| # | Tarea | Archivos |
|---|-------|----------|
| 1 | Server actions — CRUD activos, crear control AFT, ejecutar control, mover activo | `src/app/actions/aft.ts` |
| 2 | Zod schemas — Validación de activo (tipo, estado, fechas), control, movimiento | `src/lib/schemas/aft.ts` |
| 3 | Página: Listado de activos — Tabla filtrable por local/tipo/estado con búsqueda | `src/app/(dashboard)/aft/page.tsx` |
| 4 | Página: Registrar activo — Formulario con datos del activo + selección de local | `src/app/(dashboard)/aft/nuevo/page.tsx` |
| 5 | Página: Detalle de activo — Info + historial de movimientos + controles realizados | `src/app/(dashboard)/aft/[id]/page.tsx` |
| 6 | Página: Mover activo — Seleccionar local origen/destino, motivo, fecha | `src/app/(dashboard)/aft/[id]/mover/page.tsx` |
| 7 | Página: Controles AFT — Listado de controles planificados/realizados por local | `src/app/(dashboard)/aft/controles/page.tsx` |
| 8 | Página: Ejecutar control — Check de presencia y estado de cada activo en un local | `src/app/(dashboard)/aft/controles/nuevo/page.tsx` |
| 9 | Generación de QR — Botón para marcar activo con QR (placeholder para impresión) | Dentro de detalle de activo |

---

## Fase 3 — RRHH (Trabajadores + Nóminas)

**Objetivo**: Gestión de trabajadores, cargos, horarios, hojas de firma y prenóminas.

**Modelos involucrados**: `Cargo`, `Trabajador`, `Horario`, `HojaFirma`, `DetalleHojaFirma`, `Prenomina`

| # | Tarea | Archivos |
|---|-------|----------|
| 1 | Server actions — CRUD cargos, trabajadores, horarios, hojas de firma, prenóminas | `src/app/actions/rrhh.ts` |
| 2 | Zod schemas — Validación de CI, fechas, cálculo de nómina | `src/lib/schemas/rrhh.ts` |
| 3 | Página: Listado de trabajadores — Tabla con filtro por cargo/activo, búsqueda | `src/app/(dashboard)/rrhh/page.tsx` |
| 4 | Página: Registrar trabajador — Formulario con datos personales + selección de cargo | `src/app/(dashboard)/rrhh/nuevo/page.tsx` |
| 5 | Página: Detalle de trabajador — Info + horario semanal + hojas de firma + prenóminas | `src/app/(dashboard)/rrhh/[id]/page.tsx` |
| 6 | Página: Editar horario semanal — Tabla con 7 días, hora entrada/salida por día | `src/app/(dashboard)/rrhh/[id]/horario/page.tsx` |
| 7 | Página: Cargos — CRUD de cargos con nivel jerárquico | `src/app/(dashboard)/rrhh/cargos/page.tsx` |
| 8 | Página: Hojas de firma — Generar hoja mensual, registrar firmas diarias | `src/app/(dashboard)/rrhh/firmas/page.tsx` |
| 9 | Página: Prenóminas — Generar prenómina mensual (días trabajados, valor día, total) | `src/app/(dashboard)/rrhh/prenominas/page.tsx` |

---

## Fase 4 — Mejoras Generales

| # | Tarea | Archivos |
|---|-------|----------|
| 1 | UI Kit — Componentes reutilizables (botones, inputs, tablas, cards, modales) | `src/components/ui/` |
| 2 | Página raíz (`/`) — Redirigir a `/dashboard` o landing del sistema | `src/app/page.tsx` |
| 3 | Dashboard mejorado — Cards dinámicas con datos reales de todos los módulos | `src/app/(dashboard)/dashboard/page.tsx` |
| 4 | Manejo de errores global — Toast/snackbar para feedback de acciones | `src/components/providers/toast.tsx` |
