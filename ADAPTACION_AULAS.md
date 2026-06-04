# Adaptación del módulo Aulas — Inspirado en Control_Aulas

## Referencia
`E:\Mis proyectos\Control_Aulas` — App React standalone con SQL.js para control de tecnología en aulas.

## Cambios a realizar

### 1. Server actions (nuevas)
| Acción | Descripción |
|--------|-------------|
| `toggleBloqueoLocal` | Bloquear/desbloquear un local para revisión |

### 2. Páginas a rediseñar
| Ruta | Cambio |
|------|--------|
| `/aulas/[sessionId]` | → **Panel**: header gradient + stats cards + grid de locales coloreados + toggle bloqueo |
| `/aulas` | → **Historial**: lista de sesiones expandibles con stats + activar/eliminar |
| `/aulas/[sessionId]/[visitaId]` | → **ReviewForm**: toggles OK/Problema, badges de equipo, barra de progreso |
| `/aulas/[sessionId]/reporte` | → **Reporte**: stats + detalle problemas + botón imprimir |

### 3. Elementos visuales a replicar
- Header gradient azul (#1e3a8a → #2563eb) con info de facultad/depto
- Barra de progreso en header
- 4 stats cards: Total, Revisados, Problemas, Pendientes
- Tarjetas de local con color según estado (verde/rojo/amarillo/gris)
- Badges de equipo (PC, Periféricos, TV, TW, DS) en cada tarjeta
- Toggle bloqueo/desbloqueo por local
- Tabs: Panel / Reporte (dentro de sesión)
- Formulario de revisión con toggles OK/Problema + notas por equipo
- Historial expandible con detalle inline por sesión
- Reporte con resumen + detalle + generación HTML para imprimir

### 4. Lo que NO se toca
- Schema de Prisma (modelos Locale, Medio, VisitaAula, DetalleVisita)
- Server actions existentes (`iniciarSession`, `guardarRevisionLocal`, `eliminarSession`, `obtenerSesiones`, `obtenerSession`)
- Autenticación y middleware
- Lógica de base de datos existente

### 5. Orden de implementación
1. Server action `toggleBloqueoLocal`
2. Rediseño de `aulas/[sessionId]` (Panel)
3. Rediseño de `aulas/` (Historial)
4. Rediseño de `aulas/[sessionId]/[visitaId]` (ReviewForm)
5. Nueva página `aulas/[sessionId]/reporte` (Reporte + imprimir)
