import { z } from "zod";

export const iniciarSessionSchema = z.object({
  revisor: z.string().min(1, "El nombre del revisor es obligatorio").max(200),
  fecha_visita: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
});

export const detalleRevisionSchema = z.object({
  medio_id: z.string().uuid(),
  estado: z.enum(["bien", "regular", "mal", "ausente"]),
  observaciones: z.string().max(1000).optional().default(""),
});

export const guardarRevisionLocalSchema = z.object({
  visita_id: z.string().uuid(),
  estado_general: z.enum(["bien", "regular", "mal"]),
  observaciones_generales: z.string().max(2000).optional().default(""),
  detalles: z.array(detalleRevisionSchema).min(1, "Debe haber al menos un medio evaluado"),
});

export const eliminarSessionSchema = z.object({
  session_id: z.string().uuid(),
});

export type IniciarSessionData = z.infer<typeof iniciarSessionSchema>;
export type GuardarRevisionLocalData = z.infer<typeof guardarRevisionLocalSchema>;
export type DetalleRevisionData = z.infer<typeof detalleRevisionSchema>;
