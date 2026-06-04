export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProfileRole = "admin" | "jefe" | "rrhh" | "tecnico" | "especialista_hardware";
export type LocaleTipo = "aula" | "laboratorio" | "oficina" | "almacen" | "otro";
export type GuardiaEstado = "pendiente_entrega" | "pendiente_recibo" | "completado" | "con_discrepancias";
export type GuardiaTurno = "matutino" | "vespertino";
export type IncidenciaTipo = "rotura" | "perdida" | "mal_funcionamiento" | "otro";
export type ActivoTipo = 'computadora' | 'monitor' | 'teclado' | 'mouse' | 'ups' | 'tv' | 'datachow' | 'televiewer' | 'proyector' | 'impresora' | 'camara' | 'telefono' | 'mueble' | 'otro';
export type ActivoEstado = "nuevo" | "bueno" | "regular" | "malo" | "baja_propuesta" | "dado_de_baja";
export type ControlEstado = 'planificado' | 'en_curso' | 'completado' | 'cancelado';

export interface Activo {
  id: string;
  organization_id: string | null;
  locale_id: string;
  tipo: ActivoTipo;
  numero_medio_basico: string;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  estado: ActivoEstado;
  fecha_adquisicion: string | null;
  ultimo_control_date: string | null;
  tiene_qr: boolean;
  observaciones: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ============================================================================
// AFT v2 — Rediseño basado en Áreas de Responsabilidad
// ============================================================================

export interface AreaAft {
  id: string;
  organization_id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MbArea {
  id: string;
  area_id: string;
  mb: string;
  descripcion: string | null;
  user_id: string | null;
  created_at: string;
}

export interface ActivoAft {
  id: string;
  control_id: string;
  mb: string;
  descripcion: string | null;
  escaneado: boolean;
  fecha_escaneo: string | null;
  user_id: string | null;
  created_at: string;
}

export interface ControlAft {
  id: string;
  organization_id: string | null;
  area_id: string;
  fecha_planificada: string;
  fecha_realizada: string | null;
  estado: ControlEstado;
  observaciones: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DetalleControl {
  id: string;
  control_id: string;
  activo_id: string;
  presente: boolean;
  estado_observado: 'nuevo' | 'bueno' | 'regular' | 'malo' | null;
  observaciones: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}


export interface Locale {
  id: string;
  codigo: string;
  nombre: string;
  tipo: LocaleTipo;
  edificio: string | null;
  piso: number | null;
  capacidad: number | null;
  estado: "activo" | "inactivo" | "mantenimiento";
  observaciones: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Guardia {
  id: string;
  fecha: string;
  turno: GuardiaTurno;
  entregado_por: string | null;
  recibido_por: string | null;
  estado: GuardiaEstado;
  observaciones_generales: string | null;
  created_at: string;
  user_id: string;
}

export interface ObservacionGuardia {
  id: string;
  guardia_id: string;
  locale_id: string;
  tipo: "entrega" | "recibo";
  pc_encendidas: number | null;
  pc_estado: string | null;
  pc_observaciones: string | null;
  perifericos_estado: string | null;
  cables_red_conteo: number | null;
  cables_red_estado: string | null;
  cables_corriente_conteo: number | null;
  cables_corriente_estado: string | null;
  estado_general: "bien" | "regular" | "mal";
  observaciones: string | null;
  created_at: string;
  user_id: string;
}

export interface Incidencia {
  id: string;
  guardia_id: string | null;
  locale_id: string;
  tipo: IncidenciaTipo;
  descripcion: string;
  urgente: boolean;
  resuelta: boolean;
  fecha_solucion: string | null;
  solucion: string | null;
  created_at: string;
  user_id: string;
}

export interface Trabajador {
  id: string;
  user_id: string | null;
  cargo_id: string;
  nombre_completo: string;
  ci: string;
  telefono: string | null;
  fecha_ingreso: string;
  activo: boolean;
  created_at: string;
}

export interface Cargo {
  id: string;
  nombre: string;
  descripcion: string | null;
  nivel: number | null;
}

export interface VisitaAula {
  id: string;
  organization_id: string | null;
  fecha_visita: string;
  revisor: string;
  estado_general: "bien" | "regular" | "mal" | null;
  observaciones_generales: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DetalleVisita {
  id: string;
  visita_id: string;
  medio_id: string;
  estado: "bien" | "regular" | "mal" | "ausente";
  observaciones: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ============================================================================
// GUARDIA — Parte diario de entrega/recibo
// ============================================================================

export type GuardiaAreaTipo = "laboratorio" | "oficina";
export type GuardiaParteEstado = "borrador" | "completado";

export interface GuardiaArea {
  id: string;
  organization_id: string;
  codigo: string;
  nombre: string;
  tipo: GuardiaAreaTipo;
  activo: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface GuardiaPeriferico {
  id: string;
  area_id: string;
  nombre: string;
  orden: number;
  activo: boolean;
  user_id: string;
  created_at: string;
  deleted_at: string | null;
}

export interface GuardiaParte {
  id: string;
  organization_id: string;
  fecha: string;
  estado: GuardiaParteEstado;
  observaciones_generales: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface GuardiaRegistro {
  id: string;
  guardia_parte_id: string;
  area_id: string;
  entregado_por_nombre: string | null;
  entregado_por_solapin: string | null;
  entregado_por_user_id: string | null;
  fecha_hora_entrega: string | null;
  recibido_por_nombre: string | null;
  recibido_por_solapin: string | null;
  recibido_por_user_id: string | null;
  fecha_hora_recibo: string | null;
  observaciones: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface GuardiaDetalle {
  id: string;
  guardia_registro_id: string;
  periferico_id: string;
  cantidad_entrega: number;
  cantidad_recibo: number;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuardiaParteConRegistros extends GuardiaParte {
  registros: (GuardiaRegistro & {
    area: GuardiaArea;
    detalles: (GuardiaDetalle & { periferico: GuardiaPeriferico })[];
  })[];
}

export interface GuardiaAreaConPerifericos extends GuardiaArea {
  perifericos: GuardiaPeriferico[];
}
