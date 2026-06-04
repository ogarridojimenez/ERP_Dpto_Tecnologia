import { z } from "zod";

// ============================================================================
// HELPERS
// ============================================================================

export const uuidSchema = z.string().uuid("ID inválido");

// ============================================================================
// Schemas del modelo anterior (mantener para compatibilidad)
// ============================================================================

// Schemas del modelo anterior (mantener para compatibilidad)
export const activoSchema = z.object({
  locale_id: z.string().min(1, "El local es obligatorio"),
  tipo: z.enum(['computadora', 'monitor', 'teclado', 'mouse', 'ups', 'tv', 'datachow', 'televiewer', 'proyector', 'impresora', 'camara', 'telefono', 'mueble', 'otro']),
  numero_medio_basico: z.string().min(2, "El número de medio es obligatorio"),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  numero_serie: z.string().optional(),
  estado: z.enum(['nuevo', 'bueno', 'regular', 'malo', 'baja_propuesta', 'dado_de_baja']),
  fecha_adquisicion: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

export const movimientoActivoSchema = z.object({
  activo_id: z.string().min(1, "El activo es obligatorio"),
  locale_origen_id: z.string().min(1, "El local origen es obligatorio"),
  locale_destino_id: z.string().min(1, "El local destino es obligatorio"),
  fecha_movimiento: z.string().optional(),
  motivo: z.string().min(3, "El motivo es obligatorio"),
  observaciones: z.string().optional().nullable(),
});

export const detalleControlSchema = z.object({
  control_id: z.string().min(1, "El control es obligatorio"),
  activo_id: z.string().min(1, "El activo es obligatorio"),
  presente: z.boolean().default(true),
  estado_observado: z.enum(['nuevo', 'bueno', 'regular', 'malo']).optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

// ============================================================================
// AFT v2 — Schemas del nuevo modelo
// ============================================================================

export const areaAftSchema = z.object({
  codigo: z.string().min(1, "El código es obligatorio").max(50),
  nombre: z.string().min(2, "El nombre es obligatorio").max(200),
  activo: z.boolean().default(true),
});

export const controlAftSchema = z.object({
  area_id: z.string().min(1, "El área es obligatoria"),
  fecha_planificada: z.string().min(1, "La fecha es obligatoria"),
  estado: z.enum(['planificado', 'en_curso', 'completado', 'cancelado']).default('planificado'),
  observaciones: z.string().optional().nullable(),
});

export const mbAreaSchema = z.object({
  area_id: z.string().min(1),
  mb: z.string().min(1),
  descripcion: z.string().optional().nullable(),
});

export type ActivoForm = z.infer<typeof activoSchema>;
export type MovimientoActivoForm = z.infer<typeof movimientoActivoSchema>;
export type ControlAftForm = z.infer<typeof controlAftSchema>;
export type DetalleControlForm = z.infer<typeof detalleControlSchema>;
export type AreaAftForm = z.infer<typeof areaAftSchema>;
export type MbAreaForm = z.infer<typeof mbAreaSchema>;

// ============================================================================
// GUARDIA — Schemas del parte diario
// ============================================================================

export const guardiaAreaSchema = z.object({
  codigo: z.string().min(1, "El codigo es obligatorio").max(50),
  nombre: z.string().min(2, "El nombre es obligatorio").max(200),
  tipo: z.enum(["laboratorio", "oficina"]).default("laboratorio"),
  activo: z.boolean().default(true),
});

export const guardiaPerifericoSchema = z.object({
  area_id: z.string().min(1),
  nombre: z.string().min(1, "El nombre es obligatorio").max(100),
  orden: z.number().int().min(0).default(0),
  activo: z.boolean().default(true),
});

export const guardiaParteSchema = z.object({
  fecha: z.string().min(1, "La fecha es obligatoria"),
  observaciones_generales: z.string().optional().nullable(),
});

export const guardiaEntregaSchema = z.object({
  entregado_por_nombre: z.string().min(1, "El nombre es obligatorio"),
  entregado_por_solapin: z.string().min(1, "El solapin es obligatorio"),
  observaciones: z.string().optional().nullable(),
  detalles: z.array(z.object({
    periferico_id: z.string(),
    cantidad: z.number().int().min(0),
    observaciones: z.string().optional().nullable(),
  })),
});

export const guardiaReciboSchema = z.object({
  recibido_por_nombre: z.string().min(1, "El nombre es obligatorio"),
  recibido_por_solapin: z.string().min(1, "El solapin es obligatorio"),
  observaciones: z.string().optional().nullable(),
  detalles: z.array(z.object({
    periferico_id: z.string(),
    cantidad: z.number().int().min(0),
    observaciones: z.string().optional().nullable(),
  })),
});

export type GuardiaAreaForm = z.infer<typeof guardiaAreaSchema>;
export type GuardiaPerifericoForm = z.infer<typeof guardiaPerifericoSchema>;
export type GuardiaParteForm = z.infer<typeof guardiaParteSchema>;
export type GuardiaEntregaForm = z.infer<typeof guardiaEntregaSchema>;
export type GuardiaReciboForm = z.infer<typeof guardiaReciboSchema>;

// ============================================================================
// SYNC DESDE APP MÓVIL
// ============================================================================

export const syncScansSchema = z.object({
  control_id: uuidSchema,
  scans: z.array(z.string().min(1)).max(1000, "Demasiados escaneos (max 1000)"),
});

export type SyncScansForm = z.infer<typeof syncScansSchema>;
