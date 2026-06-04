# Spec: Módulo AFT v2 — Rediseño basado en Áreas de Responsabilidad

## 1. Visión General
Reescribir el módulo AFT siguiendo el modelo de "Listado de Activos Fijos" usado en la UCI Cuba. Las **Áreas de Responsabilidad** (codigo + nombre) se crean manualmente. Los **Activos** (MBs) viven SOLO dentro del Excel de cada control: no hay catálogo global. La **App Móvil** es obligatoria para la captura offline. La **Web** se enfoca en planificar controles, cargar Excels, revisar conciliaciones y mantener historial.

## 2. Modelo de Datos (nuevo)

### 2.1. Tabla `areas_aft` (NUEVA)
```sql
CREATE TABLE areas_aft (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  codigo TEXT NOT NULL,             -- ej: '2000016'
  nombre TEXT NOT NULL,             -- ej: 'ACADEMIA CISCO - AULA'
  activo BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, codigo)
);
```

### 2.2. Tabla `controles_aft` (modificada)
- **Quitar**: `locale_id`
- **Agregar**: `area_id UUID NOT NULL REFERENCES areas_aft(id)`

### 2.3. Tabla `activos_aft` (NUEVA) — MBs del Excel de UN control
```sql
CREATE TABLE activos_aft (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID NOT NULL REFERENCES controles_aft(id) ON DELETE CASCADE,
  mb TEXT NOT NULL,                 -- número de medio, ej: 'mb000016725'
  descripcion TEXT,                 -- ej: 'Silla Uso General Base Patin'
  escaneado BOOLEAN NOT NULL DEFAULT false,  -- se marca true cuando el técnico lo escanea
  fecha_escaneo TIMESTAMPTZ,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(control_id, mb)
);
```

**Decisión clave**: NO hay catálogo global de MBs. Cada control sube su propio Excel y crea su propia lista de "esperados".

### 2.4. Tabla `detalles_control` (deprecada para AFT v2)
- Se mantiene por compatibilidad pero deja de usarse.
- La lógica de conciliación ahora se hace comparando `activos_aft` (esperados del Excel) vs `activos_aft.escaneado` (escaneados por el técnico).

### 2.5. Tabla `activos` (la actual con locale_id, marca, modelo, etc.) → deprecada para AFT
- Se mantiene porque es del modelo anterior, pero la UI AFT deja de usarla.
- Se borrarán los 28 registros de prueba.

## 3. Flujo del Usuario

```
┌─────────────────────────────────────────────────────────────┐
│ ADMIN/JEFE                                                  │
│                                                             │
│  1. /aft/areas        → Crear áreas (codigo + nombre)      │
│                                                             │
│  2. /aft/controles/nuevo                                       │
│     - Selecciona área                                       │
│     - Fecha                                                 │
│     - Sube Excel del área                                   │
│     - Sistema extrae MBs y crea activos_aft                 │
│     - Estado: 'en_curso'                                    │
│                                                             │
│  3. /aft/controles/[id]                                     │
│     - Ver conciliación                                      │
│     - Ver MBs esperados vs escaneados                       │
│     - Marcar como completado                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ TÉCNICO (App Móvil)                                         │
│                                                             │
│  1. Login                                                   │
│  2. Ver lista de controles en curso                         │
│  3. Descargar MBs del control (offline)                     │
│  4. Ir al área, escanear MBs                                │
│  5. Sincronizar (los MBs se marcan como 'escaneado')        │
└─────────────────────────────────────────────────────────────┘
```

## 4. Páginas Web (rutas)

| Ruta | Descripción | Roles |
|---|---|---|
| `/aft` | Dashboard: lista de controles + accesos rápidos | admin, jefe, tecnico, hardware |
| `/aft/areas` | Lista de áreas (CRUD) | admin, jefe |
| `/aft/areas/nueva` | Form para crear área | admin, jefe |
| `/aft/areas/[id]` | Editar área | admin, jefe |
| `/aft/controles/nuevo` | Crear control (área + fecha + Excel) | admin, jefe |
| `/aft/controles/[id]` | Detalle del control + conciliación | admin, jefe, tecnico, hardware |
| `/aft/historial` | Lista de todos los controles (con filtros) | admin, jefe, tecnico, hardware |

## 5. Excel: Formato esperado
El sistema parsea el Excel buscando filas que contengan un MB. El formato del Excel de cada área debe tener:
- Columna con MB que coincida con regex `/^(mb|MB)\d+/`
- Columna con descripción (texto libre)

El sistema toma solo los MBs que correspondan al área seleccionada (verifica con columna "Area de Responsabilidad" si existe, o acepta todo el Excel como de esa área).

## 6. App Móvil (cambios)
- Renombrar `LocalAssetsScreen` → `ControlAssetsScreen` (muestra MBs en vez de activos con UUID)
- Mostrar MB + descripción + estado (escaneado/pendiente)
- El botón "Escanear" usa el MB como identificador
- Sincronización actualiza `activos_aft.escaneado = true`

## 7. Migración
- SQL: crear `areas_aft` y `activos_aft`, modificar `controles_aft`
- Limpiar: borrar los 28 activos de prueba y el control de prueba
- Aplicar vía script Node con `pg` (igual que se hizo con el RPC)

## 8. Bug fix
- "Nuevo control" no funciona: falta `<input type="hidden" name="estado" value="planificado" />` en el form

## 9. Criterios de éxito
- [ ] Login como admin, ir a `/aft/areas`, crear "2000070 - AULA 101" con codigo "2000070" y nombre "AULA 101"
- [ ] Ir a `/aft/controles/nuevo`, seleccionar "AULA 101", subir Excel con 5 MBs
- [ ] El sistema crea el control con 5 esperados, 0 escaneados
- [ ] El técnico descarga el control en la app móvil
- [ ] El técnico escanea 3 de 5 MBs (manual o cámara)
- [ ] La web muestra conciliación: 5 esperados, 3 escaneados, 2 faltantes
- [ ] El control aparece en `/aft/historial` con su estado y resultados
- [ ] Se puede revisar el control después desde el historial
