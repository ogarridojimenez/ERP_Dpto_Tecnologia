export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activos: {
        Row: {
          created_at: string
          deleted_at: string | null
          estado: string
          fecha_adquisicion: string | null
          id: string
          locale_id: string
          marca: string | null
          modelo: string | null
          numero_medio_basico: string
          numero_serie: string | null
          observaciones: string | null
          organization_id: string | null
          tiene_qr: boolean | null
          tipo: string
          ultimo_control_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          estado?: string
          fecha_adquisicion?: string | null
          id?: string
          locale_id: string
          marca?: string | null
          modelo?: string | null
          numero_medio_basico: string
          numero_serie?: string | null
          observaciones?: string | null
          organization_id?: string | null
          tiene_qr?: boolean | null
          tipo: string
          ultimo_control_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          estado?: string
          fecha_adquisicion?: string | null
          id?: string
          locale_id?: string
          marca?: string | null
          modelo?: string | null
          numero_medio_basico?: string
          numero_serie?: string | null
          observaciones?: string | null
          organization_id?: string | null
          tiene_qr?: boolean | null
          tipo?: string
          ultimo_control_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activos_locale_id_fkey"
            columns: ["locale_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activos_locale_id_fkey"
            columns: ["locale_id"]
            isOneToOne: false
            referencedRelation: "v_visitas_completo"
            referencedColumns: ["locale_id"]
          },
          {
            foreignKeyName: "activos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      activos_aft: {
        Row: {
          control_id: string
          created_at: string | null
          descripcion: string | null
          escaneado: boolean
          fecha_escaneo: string | null
          id: string
          mb: string
          user_id: string | null
        }
        Insert: {
          control_id: string
          created_at?: string | null
          descripcion?: string | null
          escaneado?: boolean
          fecha_escaneo?: string | null
          id?: string
          mb: string
          user_id?: string | null
        }
        Update: {
          control_id?: string
          created_at?: string | null
          descripcion?: string | null
          escaneado?: boolean
          fecha_escaneo?: string | null
          id?: string
          mb?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activos_aft_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controles_aft"
            referencedColumns: ["id"]
          },
        ]
      }
      areas_aft: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string | null
          deleted_at: string | null
          id: string
          nombre: string
          organization_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          nombre: string
          organization_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          nombre?: string
          organization_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cargos: {
        Row: {
          created_at: string
          deleted_at: string | null
          descripcion: string | null
          id: string
          nivel: number | null
          nombre: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          descripcion?: string | null
          id?: string
          nivel?: number | null
          nombre: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          descripcion?: string | null
          id?: string
          nivel?: number | null
          nombre?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cargos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      controles_aft: {
        Row: {
          area_id: string
          created_at: string
          deleted_at: string | null
          estado: string
          fecha_planificada: string
          fecha_realizada: string | null
          id: string
          observaciones: string | null
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area_id: string
          created_at?: string
          deleted_at?: string | null
          estado?: string
          fecha_planificada: string
          fecha_realizada?: string | null
          id?: string
          observaciones?: string | null
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area_id?: string
          created_at?: string
          deleted_at?: string | null
          estado?: string
          fecha_planificada?: string
          fecha_realizada?: string | null
          id?: string
          observaciones?: string | null
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "controles_aft_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas_aft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_aft_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      detalles_control: {
        Row: {
          activo_id: string
          control_id: string
          created_at: string
          deleted_at: string | null
          estado_observado: string | null
          id: string
          observaciones: string | null
          presente: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          activo_id: string
          control_id: string
          created_at?: string
          deleted_at?: string | null
          estado_observado?: string | null
          id?: string
          observaciones?: string | null
          presente?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          activo_id?: string
          control_id?: string
          created_at?: string
          deleted_at?: string | null
          estado_observado?: string | null
          id?: string
          observaciones?: string | null
          presente?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detalles_control_activo_id_fkey"
            columns: ["activo_id"]
            isOneToOne: false
            referencedRelation: "activos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalles_control_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controles_aft"
            referencedColumns: ["id"]
          },
        ]
      }
      detalles_hoja_firma: {
        Row: {
          created_at: string
          deleted_at: string | null
          dia: number
          firma: string | null
          hoja_firma_id: string
          hora_entrada: string | null
          hora_salida: string | null
          id: string
          observaciones: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          dia: number
          firma?: string | null
          hoja_firma_id: string
          hora_entrada?: string | null
          hora_salida?: string | null
          id?: string
          observaciones?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          dia?: number
          firma?: string | null
          hoja_firma_id?: string
          hora_entrada?: string | null
          hora_salida?: string | null
          id?: string
          observaciones?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detalles_hoja_firma_hoja_firma_id_fkey"
            columns: ["hoja_firma_id"]
            isOneToOne: false
            referencedRelation: "hojas_firma"
            referencedColumns: ["id"]
          },
        ]
      }
      detalles_visita: {
        Row: {
          created_at: string
          deleted_at: string | null
          estado: string
          id: string
          medio_id: string
          observaciones: string | null
          updated_at: string
          user_id: string
          visita_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          estado: string
          id?: string
          medio_id: string
          observaciones?: string | null
          updated_at?: string
          user_id: string
          visita_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          estado?: string
          id?: string
          medio_id?: string
          observaciones?: string | null
          updated_at?: string
          user_id?: string
          visita_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detalles_visita_medio_id_fkey"
            columns: ["medio_id"]
            isOneToOne: false
            referencedRelation: "medios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalles_visita_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "v_visitas_completo"
            referencedColumns: ["visita_id"]
          },
          {
            foreignKeyName: "detalles_visita_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "visitas_aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      guardia_areas: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string | null
          deleted_at: string | null
          id: string
          nombre: string
          organization_id: string
          tipo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          nombre: string
          organization_id: string
          tipo?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          nombre?: string
          organization_id?: string
          tipo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardia_areas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      guardia_detalle: {
        Row: {
          cantidad_entrega: number
          cantidad_recibo: number
          created_at: string | null
          guardia_registro_id: string
          id: string
          observaciones: string | null
          periferico_id: string
          updated_at: string | null
        }
        Insert: {
          cantidad_entrega?: number
          cantidad_recibo?: number
          created_at?: string | null
          guardia_registro_id: string
          id?: string
          observaciones?: string | null
          periferico_id: string
          updated_at?: string | null
        }
        Update: {
          cantidad_entrega?: number
          cantidad_recibo?: number
          created_at?: string | null
          guardia_registro_id?: string
          id?: string
          observaciones?: string | null
          periferico_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardia_detalle_guardia_registro_id_fkey"
            columns: ["guardia_registro_id"]
            isOneToOne: false
            referencedRelation: "guardia_registros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardia_detalle_periferico_id_fkey"
            columns: ["periferico_id"]
            isOneToOne: false
            referencedRelation: "guardia_perifericos"
            referencedColumns: ["id"]
          },
        ]
      }
      guardia_partes: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          estado: string
          fecha: string
          id: string
          observaciones_generales: string | null
          organization_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          estado?: string
          fecha?: string
          id?: string
          observaciones_generales?: string | null
          organization_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          estado?: string
          fecha?: string
          id?: string
          observaciones_generales?: string | null
          organization_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardia_partes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      guardia_perifericos: {
        Row: {
          activo: boolean
          area_id: string
          created_at: string | null
          deleted_at: string | null
          id: string
          nombre: string
          orden: number
          user_id: string
        }
        Insert: {
          activo?: boolean
          area_id: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          nombre: string
          orden?: number
          user_id: string
        }
        Update: {
          activo?: boolean
          area_id?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          nombre?: string
          orden?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardia_perifericos_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "guardia_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      guardia_registros: {
        Row: {
          area_id: string
          created_at: string | null
          entregado_por_nombre: string | null
          entregado_por_solapin: string | null
          entregado_por_user_id: string | null
          fecha_hora_entrega: string | null
          fecha_hora_recibo: string | null
          guardia_parte_id: string
          id: string
          observaciones: string | null
          recibido_por_nombre: string | null
          recibido_por_solapin: string | null
          recibido_por_user_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          area_id: string
          created_at?: string | null
          entregado_por_nombre?: string | null
          entregado_por_solapin?: string | null
          entregado_por_user_id?: string | null
          fecha_hora_entrega?: string | null
          fecha_hora_recibo?: string | null
          guardia_parte_id: string
          id?: string
          observaciones?: string | null
          recibido_por_nombre?: string | null
          recibido_por_solapin?: string | null
          recibido_por_user_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          area_id?: string
          created_at?: string | null
          entregado_por_nombre?: string | null
          entregado_por_solapin?: string | null
          entregado_por_user_id?: string | null
          fecha_hora_entrega?: string | null
          fecha_hora_recibo?: string | null
          guardia_parte_id?: string
          id?: string
          observaciones?: string | null
          recibido_por_nombre?: string | null
          recibido_por_solapin?: string | null
          recibido_por_user_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardia_registros_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "guardia_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardia_registros_guardia_parte_id_fkey"
            columns: ["guardia_parte_id"]
            isOneToOne: false
            referencedRelation: "guardia_partes"
            referencedColumns: ["id"]
          },
        ]
      }
      guardias: {
        Row: {
          created_at: string
          deleted_at: string | null
          entregado_por: string | null
          estado: string
          fecha: string
          id: string
          observaciones_generales: string | null
          organization_id: string | null
          recibido_por: string | null
          turno: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          entregado_por?: string | null
          estado?: string
          fecha?: string
          id?: string
          observaciones_generales?: string | null
          organization_id?: string | null
          recibido_por?: string | null
          turno: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          entregado_por?: string | null
          estado?: string
          fecha?: string
          id?: string
          observaciones_generales?: string | null
          organization_id?: string | null
          recibido_por?: string | null
          turno?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardias_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hojas_firma: {
        Row: {
          anio: number
          created_at: string
          deleted_at: string | null
          fecha_generacion: string
          generada_por: string | null
          id: string
          mes: number
          organization_id: string | null
          trabajador_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anio: number
          created_at?: string
          deleted_at?: string | null
          fecha_generacion?: string
          generada_por?: string | null
          id?: string
          mes: number
          organization_id?: string | null
          trabajador_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anio?: number
          created_at?: string
          deleted_at?: string | null
          fecha_generacion?: string
          generada_por?: string | null
          id?: string
          mes?: number
          organization_id?: string | null
          trabajador_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hojas_firma_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hojas_firma_trabajador_id_fkey"
            columns: ["trabajador_id"]
            isOneToOne: false
            referencedRelation: "trabajadores"
            referencedColumns: ["id"]
          },
        ]
      }
      horarios: {
        Row: {
          activo: boolean | null
          created_at: string
          deleted_at: string | null
          dia_semana: number
          hora_entrada: string
          hora_salida: string
          id: string
          trabajador_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          deleted_at?: string | null
          dia_semana: number
          hora_entrada: string
          hora_salida: string
          id?: string
          trabajador_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          deleted_at?: string | null
          dia_semana?: number
          hora_entrada?: string
          hora_salida?: string
          id?: string
          trabajador_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horarios_trabajador_id_fkey"
            columns: ["trabajador_id"]
            isOneToOne: false
            referencedRelation: "trabajadores"
            referencedColumns: ["id"]
          },
        ]
      }
      incidencias: {
        Row: {
          created_at: string
          deleted_at: string | null
          descripcion: string
          fecha_solucion: string | null
          guardia_id: string | null
          id: string
          locale_id: string
          medio_id: string | null
          organization_id: string | null
          resuelta: boolean | null
          solucion: string | null
          tipo: string
          updated_at: string
          urgente: boolean | null
          user_id: string
          visita_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          descripcion: string
          fecha_solucion?: string | null
          guardia_id?: string | null
          id?: string
          locale_id: string
          medio_id?: string | null
          organization_id?: string | null
          resuelta?: boolean | null
          solucion?: string | null
          tipo: string
          updated_at?: string
          urgente?: boolean | null
          user_id: string
          visita_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          descripcion?: string
          fecha_solucion?: string | null
          guardia_id?: string | null
          id?: string
          locale_id?: string
          medio_id?: string | null
          organization_id?: string | null
          resuelta?: boolean | null
          solucion?: string | null
          tipo?: string
          updated_at?: string
          urgente?: boolean | null
          user_id?: string
          visita_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidencias_guardia_id_fkey"
            columns: ["guardia_id"]
            isOneToOne: false
            referencedRelation: "guardias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_guardia_id_fkey"
            columns: ["guardia_id"]
            isOneToOne: false
            referencedRelation: "v_guardias_discrepancias"
            referencedColumns: ["guardia_id"]
          },
          {
            foreignKeyName: "incidencias_locale_id_fkey"
            columns: ["locale_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_locale_id_fkey"
            columns: ["locale_id"]
            isOneToOne: false
            referencedRelation: "v_visitas_completo"
            referencedColumns: ["locale_id"]
          },
          {
            foreignKeyName: "incidencias_medio_id_fkey"
            columns: ["medio_id"]
            isOneToOne: false
            referencedRelation: "medios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "v_visitas_completo"
            referencedColumns: ["visita_id"]
          },
          {
            foreignKeyName: "incidencias_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "visitas_aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      locales: {
        Row: {
          capacidad: number | null
          codigo: string
          created_at: string
          deleted_at: string | null
          edificio: string | null
          estado: string
          id: string
          nombre: string
          observaciones: string | null
          organization_id: string | null
          piso: number | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capacidad?: number | null
          codigo: string
          created_at?: string
          deleted_at?: string | null
          edificio?: string | null
          estado?: string
          id?: string
          nombre: string
          observaciones?: string | null
          organization_id?: string | null
          piso?: number | null
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          capacidad?: number | null
          codigo?: string
          created_at?: string
          deleted_at?: string | null
          edificio?: string | null
          estado?: string
          id?: string
          nombre?: string
          observaciones?: string | null
          organization_id?: string | null
          piso?: number | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mb_area: {
        Row: {
          area_id: string
          created_at: string | null
          descripcion: string | null
          id: string
          mb: string
          user_id: string | null
        }
        Insert: {
          area_id: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          mb: string
          user_id?: string | null
        }
        Update: {
          area_id?: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          mb?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mb_area_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas_aft"
            referencedColumns: ["id"]
          },
        ]
      }
      medios: {
        Row: {
          codigo: string | null
          created_at: string
          deleted_at: string | null
          estado: string
          fecha_adquisicion: string | null
          id: string
          locale_id: string
          marca: string | null
          modelo: string | null
          nombre: string | null
          numero_medio_basico: string
          numero_serie: string | null
          observaciones: string | null
          organization_id: string | null
          tipo_medio_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          deleted_at?: string | null
          estado?: string
          fecha_adquisicion?: string | null
          id?: string
          locale_id: string
          marca?: string | null
          modelo?: string | null
          nombre?: string | null
          numero_medio_basico: string
          numero_serie?: string | null
          observaciones?: string | null
          organization_id?: string | null
          tipo_medio_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          codigo?: string | null
          created_at?: string
          deleted_at?: string | null
          estado?: string
          fecha_adquisicion?: string | null
          id?: string
          locale_id?: string
          marca?: string | null
          modelo?: string | null
          nombre?: string | null
          numero_medio_basico?: string
          numero_serie?: string | null
          observaciones?: string | null
          organization_id?: string | null
          tipo_medio_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medios_locale_id_fkey"
            columns: ["locale_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medios_locale_id_fkey"
            columns: ["locale_id"]
            isOneToOne: false
            referencedRelation: "v_visitas_completo"
            referencedColumns: ["locale_id"]
          },
          {
            foreignKeyName: "medios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medios_tipo_medio_id_fkey"
            columns: ["tipo_medio_id"]
            isOneToOne: false
            referencedRelation: "tipos_medio"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_activos: {
        Row: {
          activo_id: string
          created_at: string
          deleted_at: string | null
          fecha_movimiento: string
          id: string
          locale_destino_id: string
          locale_origen_id: string
          motivo: string
          observaciones: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activo_id: string
          created_at?: string
          deleted_at?: string | null
          fecha_movimiento?: string
          id?: string
          locale_destino_id: string
          locale_origen_id: string
          motivo: string
          observaciones?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activo_id?: string
          created_at?: string
          deleted_at?: string | null
          fecha_movimiento?: string
          id?: string
          locale_destino_id?: string
          locale_origen_id?: string
          motivo?: string
          observaciones?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_activos_activo_id_fkey"
            columns: ["activo_id"]
            isOneToOne: false
            referencedRelation: "activos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_activos_locale_destino_id_fkey"
            columns: ["locale_destino_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_activos_locale_destino_id_fkey"
            columns: ["locale_destino_id"]
            isOneToOne: false
            referencedRelation: "v_visitas_completo"
            referencedColumns: ["locale_id"]
          },
          {
            foreignKeyName: "movimientos_activos_locale_origen_id_fkey"
            columns: ["locale_origen_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_activos_locale_origen_id_fkey"
            columns: ["locale_origen_id"]
            isOneToOne: false
            referencedRelation: "v_visitas_completo"
            referencedColumns: ["locale_id"]
          },
        ]
      }
      observaciones_guardia: {
        Row: {
          cables_corriente_conteo: number | null
          cables_corriente_estado: string | null
          cables_red_conteo: number | null
          cables_red_estado: string | null
          created_at: string
          deleted_at: string | null
          estado_general: string
          guardia_id: string
          id: string
          locale_id: string
          observaciones: string | null
          pc_encendidas: number | null
          pc_estado: string | null
          pc_observaciones: string | null
          perifericos_estado: string | null
          perifericos_observaciones: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cables_corriente_conteo?: number | null
          cables_corriente_estado?: string | null
          cables_red_conteo?: number | null
          cables_red_estado?: string | null
          created_at?: string
          deleted_at?: string | null
          estado_general: string
          guardia_id: string
          id?: string
          locale_id: string
          observaciones?: string | null
          pc_encendidas?: number | null
          pc_estado?: string | null
          pc_observaciones?: string | null
          perifericos_estado?: string | null
          perifericos_observaciones?: string | null
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cables_corriente_conteo?: number | null
          cables_corriente_estado?: string | null
          cables_red_conteo?: number | null
          cables_red_estado?: string | null
          created_at?: string
          deleted_at?: string | null
          estado_general?: string
          guardia_id?: string
          id?: string
          locale_id?: string
          observaciones?: string | null
          pc_encendidas?: number | null
          pc_estado?: string | null
          pc_observaciones?: string | null
          perifericos_estado?: string | null
          perifericos_observaciones?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "observaciones_guardia_guardia_id_fkey"
            columns: ["guardia_id"]
            isOneToOne: false
            referencedRelation: "guardias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observaciones_guardia_guardia_id_fkey"
            columns: ["guardia_id"]
            isOneToOne: false
            referencedRelation: "v_guardias_discrepancias"
            referencedColumns: ["guardia_id"]
          },
          {
            foreignKeyName: "observaciones_guardia_locale_id_fkey"
            columns: ["locale_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observaciones_guardia_locale_id_fkey"
            columns: ["locale_id"]
            isOneToOne: false
            referencedRelation: "v_visitas_completo"
            referencedColumns: ["locale_id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      prenominas: {
        Row: {
          anio: number
          created_at: string
          deleted_at: string | null
          dias_trabajados: number
          generada_por: string | null
          id: string
          mes: number
          observaciones: string | null
          organization_id: string | null
          otros_pagos: number | null
          total: number | null
          total_devengado: number | null
          trabajador_id: string
          updated_at: string
          user_id: string
          valor_dia: number
        }
        Insert: {
          anio: number
          created_at?: string
          deleted_at?: string | null
          dias_trabajados: number
          generada_por?: string | null
          id?: string
          mes: number
          observaciones?: string | null
          organization_id?: string | null
          otros_pagos?: number | null
          total?: number | null
          total_devengado?: number | null
          trabajador_id: string
          updated_at?: string
          user_id: string
          valor_dia: number
        }
        Update: {
          anio?: number
          created_at?: string
          deleted_at?: string | null
          dias_trabajados?: number
          generada_por?: string | null
          id?: string
          mes?: number
          observaciones?: string | null
          organization_id?: string | null
          otros_pagos?: number | null
          total?: number | null
          total_devengado?: number | null
          trabajador_id?: string
          updated_at?: string
          user_id?: string
          valor_dia?: number
        }
        Relationships: [
          {
            foreignKeyName: "prenominas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prenominas_trabajador_id_fkey"
            columns: ["trabajador_id"]
            isOneToOne: false
            referencedRelation: "trabajadores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean | null
          created_at: string
          deleted_at: string | null
          id: string
          nombre_completo: string
          organization_id: string | null
          role: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          deleted_at?: string | null
          id: string
          nombre_completo: string
          organization_id?: string | null
          role?: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          nombre_completo?: string
          organization_id?: string | null
          role?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_medio: {
        Row: {
          categoria: string
          created_at: string
          deleted_at: string | null
          icono: string | null
          id: string
          nombre: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria: string
          created_at?: string
          deleted_at?: string | null
          icono?: string | null
          id?: string
          nombre: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          deleted_at?: string | null
          icono?: string | null
          id?: string
          nombre?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_medio_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      trabajadores: {
        Row: {
          activo: boolean | null
          cargo_id: string
          ci: string
          created_at: string
          created_by: string
          deleted_at: string | null
          direccion: string | null
          fecha_ingreso: string
          id: string
          nombre_completo: string
          observaciones: string | null
          organization_id: string | null
          telefono: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activo?: boolean | null
          cargo_id: string
          ci: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          direccion?: string | null
          fecha_ingreso: string
          id?: string
          nombre_completo: string
          observaciones?: string | null
          organization_id?: string | null
          telefono?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activo?: boolean | null
          cargo_id?: string
          ci?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          direccion?: string | null
          fecha_ingreso?: string
          id?: string
          nombre_completo?: string
          observaciones?: string | null
          organization_id?: string | null
          telefono?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trabajadores_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trabajadores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      visitas_aulas: {
        Row: {
          created_at: string
          deleted_at: string | null
          estado_general: string | null
          fecha_visita: string
          id: string
          locale_id: string
          observaciones_generales: string | null
          organization_id: string | null
          revisor: string
          session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          estado_general?: string | null
          fecha_visita?: string
          id?: string
          locale_id: string
          observaciones_generales?: string | null
          organization_id?: string | null
          revisor?: string
          session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          estado_general?: string | null
          fecha_visita?: string
          id?: string
          locale_id?: string
          observaciones_generales?: string | null
          organization_id?: string | null
          revisor?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitas_aulas_locale_id_fkey"
            columns: ["locale_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_aulas_locale_id_fkey"
            columns: ["locale_id"]
            isOneToOne: false
            referencedRelation: "v_visitas_completo"
            referencedColumns: ["locale_id"]
          },
          {
            foreignKeyName: "visitas_aulas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_dashboard_incidencias: {
        Row: {
          total_pendientes: number | null
          total_resueltas: number | null
          ultima_semana: number | null
          urgentes_list: Json | null
          urgentes_pendientes: number | null
        }
        Relationships: []
      }
      v_guardias_discrepancias: {
        Row: {
          entrega_cables_corriente: number | null
          entrega_cables_red: number | null
          entrega_pc: number | null
          entregado_por_nombre: string | null
          estado: string | null
          fecha: string | null
          guardia_id: string | null
          locale_codigo: string | null
          locale_nombre: string | null
          recibido_por_nombre: string | null
          recibo_cables_corriente: number | null
          recibo_cables_red: number | null
          recibo_pc: number | null
          tiene_discrepancia: boolean | null
          turno: string | null
        }
        Relationships: []
      }
      v_prenomina_mensual: {
        Row: {
          anio: number | null
          cargo: string | null
          dias_trabajados: number | null
          generada_por: string | null
          mes: number | null
          nombre_completo: string | null
          otros_pagos: number | null
          total: number | null
          total_devengado: number | null
          valor_dia: number | null
        }
        Relationships: []
      }
      v_visitas_completo: {
        Row: {
          detalle_id: string | null
          estado_general_visita: string | null
          estado_medio: string | null
          fecha_visita: string | null
          locale_codigo: string | null
          locale_id: string | null
          locale_nombre: string | null
          locale_tipo: string | null
          numero_medio_basico: string | null
          observaciones_generales: string | null
          observaciones_medio: string | null
          tecnico_id: string | null
          tecnico_nombre: string | null
          tipo_medio: string | null
          visita_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calcular_prenomina: {
        Args: { p_anio: number; p_mes: number }
        Returns: number
      }
      comparar_guardia: {
        Args: { p_guardia_id: string }
        Returns: {
          coincide: boolean
          diferencias: string
          locale_nombre: string
        }[]
      }
      generar_hojas_firma_masivas: {
        Args: { p_anio: number; p_mes: number }
        Returns: number
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sync_inventory_scans: {
        Args: { p_control_id: string; p_scans: Json }
        Returns: Json
      }
      user_organization_id: { Args: never; Returns: string }
      user_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
