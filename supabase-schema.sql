-- ============================================================================
-- SITRADE — Sistema Integrado de Tecnología, Activos y Departamentos
-- Esquema completo de base de datos para Supabase (PostgreSQL 16)
-- Ejecutar en el SQL Editor de Supabase en este orden:
--   1. Este archivo completo (Extensiones → Funciones → Tablas → RLS → Seed)
--   2. Crear usuarios en Supabase Auth UI
--   3. Ejecutar seed con los UUID reales de auth.users
-- ============================================================================

-- ############################################################################
-- 0. EXTENSIONES
-- ############################################################################
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- búsqueda difusa
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- monitoreo (opcional)


-- ############################################################################
-- 1. FUNCIONES HELPER
-- ############################################################################

-- 1.1. updated_at automático
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1.2. Obtener el rol del usuario autenticado
-- En schema public (no auth) porque Supabase no da CREATE en auth
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$;

-- 1.3. Verificar si un usuario pertenece a una organización (multi-tenancy futuro)
CREATE OR REPLACE FUNCTION public.user_organization_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT organization_id FROM profiles WHERE id = auth.uid());
END;
$$;

-- 1.4. Soft delete helper — marcar como borrado sin eliminar físicamente
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.deleted_at = now();
  RETURN NEW;
END;
$$;

-- 1.5. Trigger para forzar user_id = auth.uid() en INSERT
CREATE OR REPLACE FUNCTION force_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


-- ############################################################################
-- 2. TABLAS
-- ############################################################################

-- 2.1. ORGANIZACIONES (multi-tenancy mínimo — preparado para escalar)
CREATE TABLE IF NOT EXISTS organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- 2.2. PERFILES (extiende auth.users con roles, datos personales)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  nombre_completo text NOT NULL,
  role text NOT NULL DEFAULT 'tecnico' CHECK (role IN ('admin', 'jefe', 'rrhh', 'tecnico', 'especialista_hardware')),
  telefono text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- 2.3. LOCALES (catálogo único de todos los espacios físicos)
CREATE TABLE IF NOT EXISTS locales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  codigo text NOT NULL UNIQUE CHECK (codigo ~ '^[A-Za-z0-9][A-Za-z0-9 -]{0,29}$'),
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('aula', 'salon', 'laboratorio', 'oficina', 'almacen', 'otro')),
  edificio text,
  piso integer,
  capacidad integer CHECK (capacidad > 0),
  estado text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'mantenimiento')),
  observaciones text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- 2.4. TIPOS DE MEDIO (catálogo: PC, TV, datachow, televiewer, periférico...)
CREATE TABLE IF NOT EXISTS tipos_medio (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  nombre text NOT NULL UNIQUE,
  categoria text NOT NULL CHECK (categoria IN (
    'equipo_principal', 'periferico', 'cableado', 'mobiliario', 'otro'
  )),
  icono text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- 2.5. MEDIOS (equipos/items específicos instalados en un local)
CREATE TABLE IF NOT EXISTS medios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  locale_id uuid REFERENCES locales(id) ON DELETE RESTRICT NOT NULL,
  tipo_medio_id uuid REFERENCES tipos_medio(id) ON DELETE RESTRICT NOT NULL,
  numero_medio_basico text NOT NULL UNIQUE,
  marca text,
  modelo text,
  numero_serie text,
  estado text NOT NULL DEFAULT 'bueno' CHECK (estado IN ('nuevo', 'bueno', 'regular', 'malo', 'ausente')),
  fecha_adquisicion date,
  observaciones text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- 2.6. VISITAS A AULAS (control de tecnología)
CREATE TABLE IF NOT EXISTS visitas_aulas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  session_id uuid,  -- agrupa visitas de una misma ronda de revisión
  locale_id uuid REFERENCES locales(id) ON DELETE RESTRICT NOT NULL,
  fecha_visita date NOT NULL DEFAULT CURRENT_DATE,
  revisor text NOT NULL DEFAULT '',
  estado_general text CHECK (estado_general IN ('bien', 'regular', 'mal')),
  observaciones_generales text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- 2.7. DETALLES DE VISITA (estado de cada medio en una visita)
CREATE TABLE IF NOT EXISTS detalles_visita (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  visita_id uuid REFERENCES visitas_aulas(id) ON DELETE CASCADE NOT NULL,
  medio_id uuid REFERENCES medios(id) ON DELETE RESTRICT NOT NULL,
  estado text NOT NULL CHECK (estado IN ('bien', 'regular', 'mal', 'ausente')),
  observaciones text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  UNIQUE (visita_id, medio_id)
);

-- 2.8. GUARDIAS (registro de entrega/recibo de laboratorios)
CREATE TABLE IF NOT EXISTS guardias (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  turno text NOT NULL CHECK (turno IN ('matutino', 'vespertino')),
  -- El usuario que entrega (termina turno)
  entregado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- El usuario que recibe (empieza turno)
  recibido_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'pendiente_entrega' CHECK (estado IN (
    'pendiente_entrega', 'pendiente_recibo', 'completado', 'con_discrepancias'
  )),
  observaciones_generales text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- 2.9. OBSERVACIONES DE GUARDIA (detalle por laboratorio en cada guardia)
CREATE TABLE IF NOT EXISTS observaciones_guardia (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  guardia_id uuid REFERENCES guardias(id) ON DELETE CASCADE NOT NULL,
  locale_id uuid REFERENCES locales(id) ON DELETE RESTRICT NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrega', 'recibo')),
  pc_encendidas integer DEFAULT 0 CHECK (pc_encendidas >= 0),
  pc_estado text CHECK (pc_estado IN ('bien', 'regular', 'mal')),
  pc_observaciones text,
  perifericos_estado text CHECK (perifericos_estado IN ('bien', 'regular', 'mal')),
  perifericos_observaciones text,
  cables_red_conteo integer DEFAULT 0 CHECK (cables_red_conteo >= 0),
  cables_red_estado text CHECK (cables_red_estado IN ('bien', 'regular', 'mal')),
  cables_corriente_conteo integer DEFAULT 0 CHECK (cables_corriente_conteo >= 0),
  cables_corriente_estado text CHECK (cables_corriente_estado IN ('bien', 'regular', 'mal')),
  estado_general text NOT NULL CHECK (estado_general IN ('bien', 'regular', 'mal')),
  observaciones text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  UNIQUE (guardia_id, locale_id, tipo)
);

-- 2.10. INCIDENCIAS (problemas detectados durante guardias o visitas)
CREATE TABLE IF NOT EXISTS incidencias (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  guardia_id uuid REFERENCES guardias(id) ON DELETE SET NULL,
  visita_id uuid REFERENCES visitas_aulas(id) ON DELETE SET NULL,
  locale_id uuid REFERENCES locales(id) ON DELETE RESTRICT NOT NULL,
  medio_id uuid REFERENCES medios(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('rotura', 'perdida', 'mal_funcionamiento', 'otro')),
  descripcion text NOT NULL,
  urgente boolean DEFAULT false,
  resuelta boolean DEFAULT false,
  fecha_solucion timestamptz,
  solucion text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- 2.11. CARGOS (catálogo de puestos del departamento)
CREATE TABLE IF NOT EXISTS cargos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  nombre text NOT NULL UNIQUE,
  descripcion text,
  nivel integer DEFAULT 0,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- 2.12. TRABAJADORES (plantilla del departamento)
CREATE TABLE IF NOT EXISTS trabajadores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  cargo_id uuid REFERENCES cargos(id) ON DELETE RESTRICT NOT NULL,
  nombre_completo text NOT NULL,
  ci text NOT NULL UNIQUE,
  telefono text,
  direccion text,
  fecha_ingreso date NOT NULL,
  activo boolean DEFAULT true,
  observaciones text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- 2.13. HORARIOS (días y horas que trabaja cada trabajador)
CREATE TABLE IF NOT EXISTS horarios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trabajador_id uuid REFERENCES trabajadores(id) ON DELETE CASCADE NOT NULL,
  dia_semana integer NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
  hora_entrada time NOT NULL,
  hora_salida time NOT NULL CHECK (hora_salida > hora_entrada),
  activo boolean DEFAULT true,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  UNIQUE (trabajador_id, dia_semana)
);

-- 2.14. HOJAS DE FIRMA (registro mensual por trabajador)
CREATE TABLE IF NOT EXISTS hojas_firma (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  trabajador_id uuid REFERENCES trabajadores(id) ON DELETE CASCADE NOT NULL,
  mes integer NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio integer NOT NULL CHECK (anio >= 2020),
  generada_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_generacion date NOT NULL DEFAULT CURRENT_DATE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  UNIQUE (trabajador_id, mes, anio)
);

-- 2.15. DETALLES HOJA DE FIRMA (registro diario de entrada/salida)
CREATE TABLE IF NOT EXISTS detalles_hoja_firma (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hoja_firma_id uuid REFERENCES hojas_firma(id) ON DELETE CASCADE NOT NULL,
  dia integer NOT NULL CHECK (dia BETWEEN 1 AND 31),
  hora_entrada time,
  hora_salida time,
  firma text,
  observaciones text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  UNIQUE (hoja_firma_id, dia)
);

-- 2.16. PRENÓMINAS (cálculo mensual por trabajador)
CREATE TABLE IF NOT EXISTS prenominas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  trabajador_id uuid REFERENCES trabajadores(id) ON DELETE CASCADE NOT NULL,
  mes integer NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio integer NOT NULL CHECK (anio >= 2020),
  dias_trabajados integer NOT NULL CHECK (dias_trabajados >= 0),
  valor_dia numeric(10,2) NOT NULL CHECK (valor_dia > 0),
  total_devengado numeric(10,2) GENERATED ALWAYS AS (dias_trabajados * valor_dia) STORED,
  otros_pagos numeric(10,2) DEFAULT 0 CHECK (otros_pagos >= 0),
  total numeric(10,2) GENERATED ALWAYS AS ((dias_trabajados * valor_dia) + otros_pagos) STORED,
  observaciones text,
  generada_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  UNIQUE (trabajador_id, mes, anio)
);

-- 2.17. ACTIVOS FIJOS TANGIBLES (AFT)
CREATE TABLE IF NOT EXISTS activos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  locale_id uuid REFERENCES locales(id) ON DELETE RESTRICT NOT NULL,
  tipo text NOT NULL CHECK (tipo IN (
    'computadora', 'monitor', 'teclado', 'mouse', 'ups',
    'tv', 'datachow', 'televiewer', 'proyector',
    'impresora', 'camara', 'telefono', 'mueble', 'otro'
  )),
  numero_medio_basico text NOT NULL UNIQUE,
  marca text,
  modelo text,
  numero_serie text,
  estado text NOT NULL DEFAULT 'bueno' CHECK (estado IN (
    'nuevo', 'bueno', 'regular', 'malo', 'baja_propuesta', 'dado_de_baja'
  )),
  fecha_adquisicion date,
  ultimo_control_date date,
  tiene_qr boolean DEFAULT false,
  observaciones text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- 2.18. MOVIMIENTOS DE ACTIVOS (trazabilidad de cambios de ubicación)
CREATE TABLE IF NOT EXISTS movimientos_activos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  activo_id uuid REFERENCES activos(id) ON DELETE CASCADE NOT NULL,
  locale_origen_id uuid REFERENCES locales(id) ON DELETE RESTRICT NOT NULL,
  locale_destino_id uuid REFERENCES locales(id) ON DELETE RESTRICT NOT NULL,
  fecha_movimiento date NOT NULL DEFAULT CURRENT_DATE,
  motivo text NOT NULL,
  observaciones text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- 2.19. CONTROLES AFT (planificación de auditorías de activos)
CREATE TABLE IF NOT EXISTS controles_aft (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  locale_id uuid REFERENCES locales(id) ON DELETE RESTRICT NOT NULL,
  fecha_planificada date NOT NULL,
  fecha_realizada date,
  estado text NOT NULL DEFAULT 'planificado' CHECK (estado IN (
    'planificado', 'en_curso', 'completado', 'cancelado'
  )),
  observaciones text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- 2.20. DETALLES DE CONTROL AFT (resultado de verificación de cada activo)
CREATE TABLE IF NOT EXISTS detalles_control (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  control_id uuid REFERENCES controles_aft(id) ON DELETE CASCADE NOT NULL,
  activo_id uuid REFERENCES activos(id) ON DELETE RESTRICT NOT NULL,
  presente boolean NOT NULL DEFAULT true,
  estado_observado text CHECK (estado_observado IN (
    'nuevo', 'bueno', 'regular', 'malo'
  )),
  observaciones text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  UNIQUE (control_id, activo_id)
);


-- ############################################################################
-- 3. TRIGGERS
-- ############################################################################

-- 3.1. updated_at automático para TODAS las tablas

CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON locales
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tipos_medio
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON medios
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON visitas_aulas
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON detalles_visita
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON guardias
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON observaciones_guardia
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON incidencias
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON cargos
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON trabajadores
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON horarios
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON hojas_firma
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON detalles_hoja_firma
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON prenominas
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON activos
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON movimientos_activos
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON controles_aft
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON detalles_control
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 3.2. Forzar user_id = auth.uid() en INSERT de tablas transaccionales
-- (No aplica a profiles donde id = auth.uid() por diseño)

CREATE TRIGGER force_user_id BEFORE INSERT ON locales
  FOR EACH ROW EXECUTE FUNCTION force_user_id();
CREATE TRIGGER force_user_id BEFORE INSERT ON tipos_medio
  FOR EACH ROW EXECUTE FUNCTION force_user_id();
CREATE TRIGGER force_user_id BEFORE INSERT ON medios
  FOR EACH ROW EXECUTE FUNCTION force_user_id();
CREATE TRIGGER force_user_id BEFORE INSERT ON visitas_aulas
  FOR EACH ROW EXECUTE FUNCTION force_user_id();
CREATE TRIGGER force_user_id BEFORE INSERT ON detalles_visita
  FOR EACH ROW EXECUTE FUNCTION force_user_id();
CREATE TRIGGER force_user_id BEFORE INSERT ON guardias
  FOR EACH ROW EXECUTE FUNCTION force_user_id();
CREATE TRIGGER force_user_id BEFORE INSERT ON observaciones_guardia
  FOR EACH ROW EXECUTE FUNCTION force_user_id();
CREATE TRIGGER force_user_id BEFORE INSERT ON incidencias
  FOR EACH ROW EXECUTE FUNCTION force_user_id();
CREATE TRIGGER force_user_id BEFORE INSERT ON cargos
  FOR EACH ROW EXECUTE FUNCTION force_user_id();
CREATE TRIGGER force_user_id BEFORE INSERT ON horarios
  FOR EACH ROW EXECUTE FUNCTION force_user_id();
CREATE TRIGGER force_user_id BEFORE INSERT ON hojas_firma
  FOR EACH ROW EXECUTE FUNCTION force_user_id();
CREATE TRIGGER force_user_id BEFORE INSERT ON detalles_hoja_firma
  FOR EACH ROW EXECUTE FUNCTION force_user_id();
CREATE TRIGGER force_user_id BEFORE INSERT ON prenominas
  FOR EACH ROW EXECUTE FUNCTION force_user_id();
CREATE TRIGGER force_user_id BEFORE INSERT ON activos
  FOR EACH ROW EXECUTE FUNCTION force_user_id();
CREATE TRIGGER force_user_id BEFORE INSERT ON movimientos_activos
  FOR EACH ROW EXECUTE FUNCTION force_user_id();
CREATE TRIGGER force_user_id BEFORE INSERT ON controles_aft
  FOR EACH ROW EXECUTE FUNCTION force_user_id();
CREATE TRIGGER force_user_id BEFORE INSERT ON detalles_control
  FOR EACH ROW EXECUTE FUNCTION force_user_id();


-- ############################################################################
-- 4. ÍNDICES
-- ############################################################################

-- 4.1. FK indexes (evitan sequential scans en JOINs)
CREATE INDEX idx_locales_organization ON locales(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_medios_locale ON medios(locale_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_medios_tipo ON medios(tipo_medio_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_visitas_locale ON visitas_aulas(locale_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_detalles_visita_visita ON detalles_visita(visita_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_guardias_fecha ON guardias(fecha DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_observaciones_guardia_guardia ON observaciones_guardia(guardia_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_observaciones_guardia_locale ON observaciones_guardia(locale_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_incidencias_locale ON incidencias(locale_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_incidencias_resuelta ON incidencias(resuelta) WHERE deleted_at IS NULL;
CREATE INDEX idx_trabajadores_cargo ON trabajadores(cargo_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_horarios_trabajador ON horarios(trabajador_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_hojas_firma_trabajador ON hojas_firma(trabajador_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_detalles_firma_hoja ON detalles_hoja_firma(hoja_firma_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_prenominas_trabajador ON prenominas(trabajador_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_activos_locale ON activos(locale_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_activos_estado ON activos(estado) WHERE deleted_at IS NULL;
CREATE INDEX idx_movimientos_activo ON movimientos_activos(activo_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_controles_locale ON controles_aft(locale_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_detalles_control_control ON detalles_control(control_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_detalles_control_activo ON detalles_control(activo_id) WHERE deleted_at IS NULL;

-- 4.2. Compuestos para queries frecuentes
CREATE INDEX idx_visitas_fecha_locale ON visitas_aulas(fecha_visita DESC, locale_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_visitas_session ON visitas_aulas(session_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_guardias_fecha_turno ON guardias(fecha DESC, turno) WHERE deleted_at IS NULL;
CREATE INDEX idx_activos_numero_medio ON activos(numero_medio_basico) WHERE deleted_at IS NULL;
CREATE INDEX idx_prenominas_mes_anio ON prenominas(anio DESC, mes DESC) WHERE deleted_at IS NULL;

-- 4.3. Búsqueda de texto (nombres, descripciones)
CREATE INDEX idx_locales_nombre_trgm ON locales USING gin (nombre gin_trgm_ops);
CREATE INDEX idx_trabajadores_nombre_trgm ON trabajadores USING gin (nombre_completo gin_trgm_ops);
CREATE INDEX idx_activos_marca_modelo_trgm ON activos USING gin (marca gin_trgm_ops, modelo gin_trgm_ops);

-- 4.4. Para reportes de consejo de dirección (discrepancias activas)
CREATE INDEX idx_guardias_con_discrepancias ON guardias(estado) WHERE estado = 'con_discrepancias' AND deleted_at IS NULL;
CREATE INDEX idx_incidencias_urgentes ON incidencias(urgente, resuelta) WHERE urgente = true AND resuelta = false AND deleted_at IS NULL;


-- ############################################################################
-- 5. ROW LEVEL SECURITY (RLS)
-- ############################################################################

-- 5.1. Helper: actualizar updated_at en tablas que no tienen trigger
-- (ya tenemos triggers, pero este es un helper para funciones manuales)

-- 5.2. ORGANIZATIONS — lectura para autenticados, escritura solo admin
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select_auth" ON organizations
  FOR SELECT USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "org_insert_admin" ON organizations
  FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe'));

CREATE POLICY "org_update_admin" ON organizations
  FOR UPDATE USING (user_role() IN ('admin', 'jefe'));

CREATE POLICY "org_delete_admin" ON organizations
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- 5.3. PROFILES — cada uno ve su propio perfil. Admin ve todos.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (
    (auth.uid() = id AND deleted_at IS NULL)
    OR user_role() IN ('admin', 'jefe')
  );

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id OR user_role() IN ('admin', 'jefe'));

CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- 5.4. LOCALES — todos los autenticados pueden leer, solo admin escribe
ALTER TABLE locales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locales_select" ON locales
  FOR SELECT USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "locales_insert" ON locales
  FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe'));

CREATE POLICY "locales_update" ON locales
  FOR UPDATE USING (user_role() IN ('admin', 'jefe'));

CREATE POLICY "locales_delete" ON locales
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- 5.5. TIPOS_MEDIO — idem locales
ALTER TABLE tipos_medio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tipos_medio_select" ON tipos_medio
  FOR SELECT USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "tipos_medio_insert" ON tipos_medio
  FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe'));

CREATE POLICY "tipos_medio_update" ON tipos_medio
  FOR UPDATE USING (user_role() IN ('admin', 'jefe'));

CREATE POLICY "tipos_medio_delete" ON tipos_medio
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- 5.6. MEDIOS — todos pueden leer (lo necesitan para visitas), solo admin escribe
ALTER TABLE medios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medios_select" ON medios
  FOR SELECT USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "medios_insert" ON medios
  FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe', 'tecnico', 'especialista_hardware'));

CREATE POLICY "medios_update" ON medios
  FOR UPDATE USING (user_role() IN ('admin', 'jefe', 'tecnico', 'especialista_hardware'));

CREATE POLICY "medios_delete" ON medios
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- 5.7. VISITAS_AULAS — cada quien ve sus propias visitas. Admin y jefe ven todo.
ALTER TABLE visitas_aulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visitas_select_own" ON visitas_aulas
  FOR SELECT USING (
    (auth.uid() = user_id AND deleted_at IS NULL)
    OR user_role() IN ('admin', 'jefe', 'especialista_hardware')
  );

CREATE POLICY "visitas_insert_own" ON visitas_aulas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "visitas_update_own" ON visitas_aulas
  FOR UPDATE USING (
    (auth.uid() = user_id)
    OR user_role() IN ('admin', 'jefe', 'especialista_hardware')
  );

CREATE POLICY "visitas_delete_own" ON visitas_aulas
  FOR DELETE USING (
    auth.uid() = user_id
    OR user_role() IN ('admin', 'jefe')
  );

-- 5.8. DETALLES_VISITA — mismo modelo que visitas (hereda por user_id)
ALTER TABLE detalles_visita ENABLE ROW LEVEL SECURITY;

CREATE POLICY "detalles_visita_select_own" ON detalles_visita
  FOR SELECT USING (
    (auth.uid() = user_id AND deleted_at IS NULL)
    OR user_role() IN ('admin', 'jefe', 'especialista_hardware')
  );

CREATE POLICY "detalles_visita_insert_own" ON detalles_visita
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "detalles_visita_update_own" ON detalles_visita
  FOR UPDATE USING (
    (auth.uid() = user_id)
    OR user_role() IN ('admin', 'jefe', 'especialista_hardware')
  );

CREATE POLICY "detalles_visita_delete_own" ON detalles_visita
  FOR DELETE USING (
    auth.uid() = user_id
    OR user_role() IN ('admin', 'jefe')
  );

CREATE POLICY "detalles_visita_insert_own" ON detalles_visita
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "detalles_visita_update_own" ON detalles_visita
  FOR UPDATE USING (
    (auth.uid() = user_id)
    OR user_role() IN ('admin', 'jefe')
  );

CREATE POLICY "detalles_visita_delete_own" ON detalles_visita
  FOR DELETE USING (
    auth.uid() = user_id
    OR user_role() IN ('admin', 'jefe')
  );

-- 5.9. GUARDIAS — regla especial: puedes ver guardias donde eres
--      entregado_por, recibido_por, o user_id (creador). Admin/jefe ven todo.
ALTER TABLE guardias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guardias_select_involved" ON guardias
  FOR SELECT USING (
    (
      deleted_at IS NULL
      AND (
        auth.uid() = user_id
        OR auth.uid() = entregado_por
        OR auth.uid() = recibido_por
      )
    )
    OR user_role() IN ('admin', 'jefe')
  );

CREATE POLICY "guardias_insert" ON guardias
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "guardias_update_involved" ON guardias
  FOR UPDATE USING (
    (
      auth.uid() = user_id
      OR auth.uid() = entregado_por
      OR auth.uid() = recibido_por
    )
    OR user_role() IN ('admin', 'jefe')
  );

CREATE POLICY "guardias_delete_admin" ON guardias
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- 5.10. OBSERVACIONES_GUARDIA — misma regla extendida que guardias
ALTER TABLE observaciones_guardia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "obs_guardia_select_involved" ON observaciones_guardia
  FOR SELECT USING (
    (
      deleted_at IS NULL
      AND auth.uid() = user_id
    )
    OR user_role() IN ('admin', 'jefe')
    OR EXISTS (
      SELECT 1 FROM guardias g
      WHERE g.id = guardia_id
      AND (g.entregado_por = auth.uid() OR g.recibido_por = auth.uid())
    )
  );

CREATE POLICY "obs_guardia_insert" ON observaciones_guardia
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "obs_guardia_update_own" ON observaciones_guardia
  FOR UPDATE USING (
    auth.uid() = user_id
    OR user_role() IN ('admin', 'jefe')
  );

CREATE POLICY "obs_guardia_delete_admin" ON observaciones_guardia
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- 5.11. INCIDENCIAS — creador/admin/jefe ven todo lo que necesitan
ALTER TABLE incidencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "incidencias_select" ON incidencias
  FOR SELECT USING (
    (auth.uid() = user_id AND deleted_at IS NULL)
    OR user_role() IN ('admin', 'jefe', 'especialista_hardware')
  );

CREATE POLICY "incidencias_insert" ON incidencias
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "incidencias_update" ON incidencias
  FOR UPDATE USING (
    auth.uid() = user_id
    OR user_role() IN ('admin', 'jefe', 'especialista_hardware')
  );

CREATE POLICY "incidencias_delete_admin" ON incidencias
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- 5.12. CARGOS — todos los autenticados pueden leer, solo admin escribe
ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cargos_select" ON cargos
  FOR SELECT USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "cargos_insert" ON cargos
  FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe'));

CREATE POLICY "cargos_update" ON cargos
  FOR UPDATE USING (user_role() IN ('admin', 'jefe'));

CREATE POLICY "cargos_delete_admin" ON cargos
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- 5.13. TRABAJADORES — RRHH + jefe + admin pueden todo. Técnicos no ven datos personales.
ALTER TABLE trabajadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trabajadores_select" ON trabajadores
  FOR SELECT USING (
    user_role() IN ('admin', 'jefe', 'rrhh')
  );

CREATE POLICY "trabajadores_insert" ON trabajadores
  FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe', 'rrhh'));

CREATE POLICY "trabajadores_update" ON trabajadores
  FOR UPDATE USING (user_role() IN ('admin', 'jefe', 'rrhh'));

CREATE POLICY "trabajadores_delete_admin" ON trabajadores
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- 5.14. HORARIOS — mismo criterio que trabajadores (datos sensibles)
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "horarios_select" ON horarios
  FOR SELECT USING (
    user_role() IN ('admin', 'jefe', 'rrhh')
  );

CREATE POLICY "horarios_insert" ON horarios
  FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe', 'rrhh'));

CREATE POLICY "horarios_update" ON horarios
  FOR UPDATE USING (user_role() IN ('admin', 'jefe', 'rrhh'));

CREATE POLICY "horarios_delete_admin" ON horarios
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- 5.15. HOJAS_FIRMA — RRHH + jefe + admin. Técnico solo ve su propia hoja.
ALTER TABLE hojas_firma ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hojas_firma_select" ON hojas_firma
  FOR SELECT USING (
    user_role() IN ('admin', 'jefe', 'rrhh')
    OR auth.uid() = user_id
  );

CREATE POLICY "hojas_firma_insert" ON hojas_firma
  FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe', 'rrhh'));

CREATE POLICY "hojas_firma_update" ON hojas_firma
  FOR UPDATE USING (user_role() IN ('admin', 'jefe', 'rrhh'));

CREATE POLICY "hojas_firma_delete_admin" ON hojas_firma
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- 5.16. DETALLES_HOJA_FIRMA — hereda permisos de hojas_firma
ALTER TABLE detalles_hoja_firma ENABLE ROW LEVEL SECURITY;

CREATE POLICY "detalles_firma_select" ON detalles_hoja_firma
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM hojas_firma hf
      WHERE hf.id = hoja_firma_id
      AND (hf.user_id = auth.uid() OR user_role() IN ('admin', 'jefe', 'rrhh'))
    )
  );

CREATE POLICY "detalles_firma_insert" ON detalles_hoja_firma
  FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe', 'rrhh'));

CREATE POLICY "detalles_firma_update" ON detalles_hoja_firma
  FOR UPDATE USING (user_role() IN ('admin', 'jefe', 'rrhh'));

CREATE POLICY "detalles_firma_delete_admin" ON detalles_hoja_firma
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- 5.17. PRENÓMINAS — solo RRHH, jefe y admin
ALTER TABLE prenominas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prenominas_select" ON prenominas
  FOR SELECT USING (
    user_role() IN ('admin', 'jefe', 'rrhh')
  );

CREATE POLICY "prenominas_insert" ON prenominas
  FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe', 'rrhh'));

CREATE POLICY "prenominas_update" ON prenominas
  FOR UPDATE USING (user_role() IN ('admin', 'jefe', 'rrhh'));

CREATE POLICY "prenominas_delete_admin" ON prenominas
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- 5.18. ACTIVOS — todos los autenticados pueden leer, admin/tecnico escriben
ALTER TABLE activos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activos_select" ON activos
  FOR SELECT USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "activos_insert" ON activos
  FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe', 'tecnico'));

CREATE POLICY "activos_update" ON activos
  FOR UPDATE USING (user_role() IN ('admin', 'jefe', 'tecnico'));

CREATE POLICY "activos_delete_admin" ON activos
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- 5.19. MOVIMIENTOS_ACTIVOS — idem activos
ALTER TABLE movimientos_activos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "movimientos_select" ON movimientos_activos
  FOR SELECT USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "movimientos_insert" ON movimientos_activos
  FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe', 'tecnico'));

CREATE POLICY "movimientos_update" ON movimientos_activos
  FOR UPDATE USING (user_role() IN ('admin', 'jefe', 'tecnico'));

CREATE POLICY "movimientos_delete_admin" ON movimientos_activos
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- 5.20. CONTROLES_AFT — admin y jefe planifican, técnicos ejecutan
ALTER TABLE controles_aft ENABLE ROW LEVEL SECURITY;

CREATE POLICY "controles_select" ON controles_aft
  FOR SELECT USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "controles_insert" ON controles_aft
  FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe'));

CREATE POLICY "controles_update" ON controles_aft
  FOR UPDATE USING (user_role() IN ('admin', 'jefe', 'tecnico'));

CREATE POLICY "controles_delete_admin" ON controles_aft
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- 5.21. DETALLES_CONTROL — quien ejecuta el control registra
ALTER TABLE detalles_control ENABLE ROW LEVEL SECURITY;

CREATE POLICY "detalles_control_select" ON detalles_control
  FOR SELECT USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "detalles_control_insert" ON detalles_control
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR user_role() IN ('admin', 'jefe')
  );

CREATE POLICY "detalles_control_update" ON detalles_control
  FOR UPDATE USING (
    auth.uid() = user_id
    OR user_role() IN ('admin', 'jefe')
  );

CREATE POLICY "detalles_control_delete_admin" ON detalles_control
  FOR DELETE USING (user_role() IN ('admin', 'jefe'));


-- ############################################################################
-- 6. VISTAS ÚTILES
-- ############################################################################

-- 6.1. Visitas con detalle completo (evita N+1 en el frontend)
CREATE OR REPLACE VIEW v_visitas_completo AS
SELECT
  v.id AS visita_id,
  v.fecha_visita,
  v.estado_general AS estado_general_visita,
  v.observaciones_generales,
  v.user_id AS tecnico_id,
  p.nombre_completo AS tecnico_nombre,
  l.id AS locale_id,
  l.codigo AS locale_codigo,
  l.nombre AS locale_nombre,
  l.tipo AS locale_tipo,
  dv.id AS detalle_id,
  m.numero_medio_basico,
  tm.nombre AS tipo_medio,
  dv.estado AS estado_medio,
  dv.observaciones AS observaciones_medio
FROM visitas_aulas v
JOIN locales l ON l.id = v.locale_id
LEFT JOIN profiles p ON p.id = v.user_id
LEFT JOIN detalles_visita dv ON dv.visita_id = v.id AND dv.deleted_at IS NULL
LEFT JOIN medios m ON m.id = dv.medio_id
LEFT JOIN tipos_medio tm ON tm.id = m.tipo_medio_id
WHERE v.deleted_at IS NULL;

-- 6.2. Guardias con resumen de discrepancias
CREATE OR REPLACE VIEW v_guardias_discrepancias AS
SELECT
  g.id AS guardia_id,
  g.fecha,
  g.turno,
  g.estado,
  p_entrega.nombre_completo AS entregado_por_nombre,
  p_recibo.nombre_completo AS recibido_por_nombre,
  l.codigo AS locale_codigo,
  l.nombre AS locale_nombre,
  o_entrega.pc_encendidas AS entrega_pc,
  o_recibo.pc_encendidas AS recibo_pc,
  o_entrega.cables_red_conteo AS entrega_cables_red,
  o_recibo.cables_red_conteo AS recibo_cables_red,
  o_entrega.cables_corriente_conteo AS entrega_cables_corriente,
  o_recibo.cables_corriente_conteo AS recibo_cables_corriente,
  CASE WHEN o_entrega.pc_encendidas IS DISTINCT FROM o_recibo.pc_encendidas
       OR o_entrega.cables_red_conteo IS DISTINCT FROM o_recibo.cables_red_conteo
       OR o_entrega.cables_corriente_conteo IS DISTINCT FROM o_recibo.cables_corriente_conteo
    THEN true ELSE false END AS tiene_discrepancia
FROM guardias g
JOIN observaciones_guardia o_entrega
  ON o_entrega.guardia_id = g.id AND o_entrega.tipo = 'entrega' AND o_entrega.deleted_at IS NULL
JOIN observaciones_guardia o_recibo
  ON o_recibo.guardia_id = g.id AND o_recibo.tipo = 'recibo' AND o_recibo.deleted_at IS NULL
  AND o_recibo.locale_id = o_entrega.locale_id
JOIN locales l ON l.id = o_entrega.locale_id
LEFT JOIN profiles p_entrega ON p_entrega.id = g.entregado_por
LEFT JOIN profiles p_recibo ON p_recibo.id = g.recibido_por
WHERE g.deleted_at IS NULL;

-- 6.3. Dashboard: resumen de incidencias activas
CREATE OR REPLACE VIEW v_dashboard_incidencias AS
SELECT
  count(*) FILTER (WHERE urgente AND NOT resuelta) AS urgentes_pendientes,
  count(*) FILTER (WHERE NOT resuelta) AS total_pendientes,
  count(*) FILTER (WHERE resuelta) AS total_resueltas,
  count(*) FILTER (WHERE i.created_at >= now() - interval '7 days') AS ultima_semana,
  jsonb_agg(jsonb_build_object(
    'id', i.id,
    'tipo', i.tipo,
    'descripcion', left(i.descripcion, 100),
    'urgente', i.urgente,
    'locale', l.nombre,
    'fecha', i.created_at
  )) FILTER (WHERE urgente AND NOT resuelta) AS urgentes_list
FROM incidencias i
JOIN locales l ON l.id = i.locale_id
WHERE i.deleted_at IS NULL;

-- 6.4. Prenómina mensual consolidada
CREATE OR REPLACE VIEW v_prenomina_mensual AS
SELECT
  p.mes,
  p.anio,
  t.nombre_completo,
  c.nombre AS cargo,
  p.dias_trabajados,
  p.valor_dia,
  p.total_devengado,
  p.otros_pagos,
  p.total,
  p.generada_por
FROM prenominas p
JOIN trabajadores t ON t.id = p.trabajador_id
JOIN cargos c ON c.id = t.cargo_id
WHERE p.deleted_at IS NULL
ORDER BY p.anio DESC, p.mes DESC, t.nombre_completo;


-- ############################################################################
-- 7. FUNCIONES DE NEGOCIO
-- ############################################################################

-- 7.1. Comparar entrega vs recibo para una guardia específica
CREATE OR REPLACE FUNCTION comparar_guardia(p_guardia_id uuid)
RETURNS TABLE (
  locale_nombre text,
  coincide boolean,
  diferencias text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.nombre,
    (o_entrega.pc_encendidas IS NOT DISTINCT FROM o_recibo.pc_encendidas
     AND o_entrega.cables_red_conteo IS NOT DISTINCT FROM o_recibo.cables_red_conteo
     AND o_entrega.cables_corriente_conteo IS NOT DISTINCT FROM o_recibo.cables_corriente_conteo
     AND o_entrega.estado_general IS NOT DISTINCT FROM o_recibo.estado_general) AS coincide,
    CASE
      WHEN o_entrega.pc_encendidas IS DISTINCT FROM o_recibo.pc_encendidas
        THEN format('PCs: %s → %s', o_entrega.pc_encendidas, o_recibo.pc_encendidas)
      WHEN o_entrega.cables_red_conteo IS DISTINCT FROM o_recibo.cables_red_conteo
        THEN format('Cables red: %s → %s', o_entrega.cables_red_conteo, o_recibo.cables_red_conteo)
      WHEN o_entrega.cables_corriente_conteo IS DISTINCT FROM o_recibo.cables_corriente_conteo
        THEN format('Cables corriente: %s → %s', o_entrega.cables_corriente_conteo, o_recibo.cables_corriente_conteo)
      WHEN o_entrega.estado_general IS DISTINCT FROM o_recibo.estado_general
        THEN format('Estado general: %s → %s', o_entrega.estado_general, o_recibo.estado_general)
      ELSE 'Sin diferencias'
    END AS diferencias
  FROM observaciones_guardia o_entrega
  JOIN observaciones_guardia o_recibo
    ON o_recibo.guardia_id = o_entrega.guardia_id
    AND o_recibo.locale_id = o_entrega.locale_id
    AND o_recibo.tipo = 'recibo'
    AND o_recibo.deleted_at IS NULL
  JOIN locales l ON l.id = o_entrega.locale_id
  WHERE o_entrega.guardia_id = p_guardia_id
    AND o_entrega.tipo = 'entrega'
    AND o_entrega.deleted_at IS NULL;
END;
$$;

-- 7.2. Cerrar guardia automáticamente cuando recibo está completo
CREATE OR REPLACE FUNCTION cerrar_guardia()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_locales integer;
  recibidos integer;
  tiene_discrepancias boolean;
BEGIN
  -- Verificar si todos los locales registrados en entrega ya tienen recibo
  SELECT count(*) INTO total_locales
  FROM observaciones_guardia
  WHERE guardia_id = NEW.guardia_id AND tipo = 'entrega' AND deleted_at IS NULL;

  SELECT count(*) INTO recibidos
  FROM observaciones_guardia
  WHERE guardia_id = NEW.guardia_id AND tipo = 'recibo' AND deleted_at IS NULL;

  IF total_locales > 0 AND recibidos >= total_locales THEN
    -- Verificar si hay discrepancias
    SELECT bool_or(
      o_entrega.pc_encendidas IS DISTINCT FROM o_recibo.pc_encendidas
      OR o_entrega.cables_red_conteo IS DISTINCT FROM o_recibo.cables_red_conteo
      OR o_entrega.cables_corriente_conteo IS DISTINCT FROM o_recibo.cables_corriente_conteo
    ) INTO tiene_discrepancias
    FROM observaciones_guardia o_entrega
    JOIN observaciones_guardia o_recibo
      ON o_recibo.guardia_id = o_entrega.guardia_id
      AND o_recibo.locale_id = o_entrega.locale_id
      AND o_recibo.tipo = 'recibo'
      AND o_recibo.deleted_at IS NULL
    WHERE o_entrega.guardia_id = NEW.guardia_id
      AND o_entrega.tipo = 'entrega'
      AND o_entrega.deleted_at IS NULL;

    IF tiene_discrepancias THEN
      UPDATE guardias SET estado = 'con_discrepancias' WHERE id = NEW.guardia_id;
    ELSE
      UPDATE guardias SET estado = 'completado' WHERE id = NEW.guardia_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER after_insert_observacion_recibo
  AFTER INSERT ON observaciones_guardia
  FOR EACH ROW
  WHEN (NEW.tipo = 'recibo')
  EXECUTE FUNCTION cerrar_guardia();

-- 7.3. Generar hojas de firma mensuales para todos los trabajadores activos
CREATE OR REPLACE FUNCTION generar_hojas_firma_masivas(
  p_mes integer,
  p_anio integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  INSERT INTO hojas_firma (trabajador_id, mes, anio, generada_por, user_id)
  SELECT
    t.id,
    p_mes,
    p_anio,
    auth.uid(),
    auth.uid()
  FROM trabajadores t
  WHERE t.activo = true
    AND t.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM hojas_firma hf
      WHERE hf.trabajador_id = t.id
        AND hf.mes = p_mes
        AND hf.anio = p_anio
        AND hf.deleted_at IS NULL
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 7.4. Calcular prenómina desde hojas de firma aprobadas
CREATE OR REPLACE FUNCTION calcular_prenomina(
  p_mes integer,
  p_anio integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  INSERT INTO prenominas (trabajador_id, mes, anio, dias_trabajados, valor_dia, generada_por, user_id)
  SELECT
    t.id,
    p_mes,
    p_anio,
    count(dhf.id) AS dias_trabajados,
    -- valor_dia por defecto (esto se ajusta manualmente después)
    0 AS valor_dia,
    auth.uid(),
    auth.uid()
  FROM trabajadores t
  JOIN hojas_firma hf ON hf.trabajador_id = t.id
    AND hf.mes = p_mes AND hf.anio = p_anio
    AND hf.deleted_at IS NULL
  JOIN detalles_hoja_firma dhf ON dhf.hoja_firma_id = hf.id
    AND dhf.hora_entrada IS NOT NULL
    AND dhf.deleted_at IS NULL
  WHERE t.activo = true AND t.deleted_at IS NULL
  GROUP BY t.id
  ON CONFLICT (trabajador_id, mes, anio)
  DO UPDATE SET dias_trabajados = EXCLUDED.dias_trabajados;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


-- ############################################################################
-- 8. SEED DATA
-- ############################################################################
-- NOTA: Ejecutar DESPUÉS de crear usuarios en Supabase Auth.
-- Reemplazar los UUID de ejemplo con los IDs reales de auth.users.

-- 8.1. Organización por defecto
INSERT INTO organizations (id, name, slug) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Departamento de Tecnología - Facultad de Ciberseguridad', 'dpto-tec-fc')
ON CONFLICT (slug) DO NOTHING;

-- 8.2. Locales (aulas, laboratorios, oficinas)
-- NOTA: Reemplaza 'SEED_USER_ID' con un UUID real de auth.users después de crearlo
INSERT INTO locales (id, organization_id, codigo, nombre, tipo, edificio, piso, user_id) VALUES
  ('a0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'A101', 'Aula 101', 'aula', 'Edificio Docente', 1, 'SEED_USER_ID'),
  ('a0000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'A102', 'Aula 102', 'aula', 'Edificio Docente', 1, 'SEED_USER_ID'),
  ('a0000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'LB201', 'Laboratorio Básico 201', 'laboratorio', 'Edificio Docente', 2, 'SEED_USER_ID'),
  ('a0000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'LB202', 'Laboratorio Básico 202', 'laboratorio', 'Edificio Docente', 2, 'SEED_USER_ID'),
  ('a0000001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'LC301', 'Laboratorio de Ciberseguridad 301', 'laboratorio', 'Edificio Docente', 3, 'SEED_USER_ID'),
  ('a0000001-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'OFI01', 'Oficina Jefatura', 'oficina', 'Edificio Docente', 1, 'SEED_USER_ID'),
  ('a0000001-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'ALM01', 'Almacén de Tecnología', 'almacen', 'Edificio Docente', 0, 'SEED_USER_ID')
ON CONFLICT (codigo) DO NOTHING;

-- 8.3. Tipos de medio
INSERT INTO tipos_medio (id, organization_id, nombre, categoria, user_id) VALUES
  ('b0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Computadora', 'equipo_principal', 'SEED_USER_ID'),
  ('b0000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Monitor', 'periferico', 'SEED_USER_ID'),
  ('b0000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Teclado', 'periferico', 'SEED_USER_ID'),
  ('b0000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Mouse', 'periferico', 'SEED_USER_ID'),
  ('b0000001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Televisor', 'equipo_principal', 'SEED_USER_ID'),
  ('b0000001-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Datachow (Proyector)', 'equipo_principal', 'SEED_USER_ID'),
  ('b0000001-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Televiewer', 'equipo_principal', 'SEED_USER_ID'),
  ('b0000001-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'UPS', 'periferico', 'SEED_USER_ID'),
  ('b0000001-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Cable de Red', 'cableado', 'SEED_USER_ID'),
  ('b0000001-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Cable de Corriente', 'cableado', 'SEED_USER_ID')
ON CONFLICT (nombre) DO NOTHING;

-- 8.4. Cargos
INSERT INTO cargos (id, organization_id, nombre, descripcion, nivel, user_id) VALUES
  ('c0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Jefe de Departamento', 'Responsable del departamento de tecnología', 5, 'SEED_USER_ID'),
  ('c0000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Especialista RRHH', 'Gestión de recursos humanos departamental', 4, 'SEED_USER_ID'),
  ('c0000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Técnico en Informática', 'Soporte técnico y mantenimiento de laboratorios', 3, 'SEED_USER_ID'),
  ('c0000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Técnico de Activos Fijos', 'Control y gestión de activos fijos tangibles', 3, 'SEED_USER_ID'),
  ('c0000001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Administrador de Red', 'Gestión de infraestructura de red', 4, 'SEED_USER_ID')
ON CONFLICT (nombre) DO NOTHING;

-- 8.5. Trabajadores (ejemplo — requiere auth.users existentes)
-- NOTA: Descomentar y ajustar cuando tengas los usuarios creados
-- INSERT INTO trabajadores (id, organization_id, user_id, cargo_id, nombre_completo, ci, telefono, fecha_ingreso) VALUES
--   ('d0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
--    'REEMPLAZAR_CON_UUID', 'c0000001-0000-0000-0000-000000000003',
--    'Javier Rodríguez', '87010112345', '+53 5 1234567', '2019-09-01');


-- ############################################################################
-- 9. GUÍA DE ERRORES COMUNES EN SUPABASE + POSTGRESQL
-- ############################################################################

-- 9.1. Error: relación "xxx" no existe
--   Causa: La tabla fue creada pero RLS bloquea todo (por defecto)
--   Solución: ALTER TABLE xxx ENABLE ROW LEVEL SECURITY;
--             y crear al menos una política SELECT

-- 9.2. Error: new row violates row-level security policy
--   Causa: INSERT sin política WITH CHECK o la política no coincide
--   Solución: Verificar que la política INSERT permita auth.uid() = user_id

-- 9.3. Error: infinite recursion detected in policy for relation "profiles"
--   Causa: La política de profiles consulta user_role() que lee profiles (loop)
--   Solución: La función user_role() usa SECURITY DEFINER y search_path = public
--             para evitar recursión. Si ves este error, revisar que esté bien definida.

-- 9.4. Error: permission denied for table xxx
--   Causa: RLS bloquea la operación o el usuario no está autenticado
--   Solución: Verificar auth.uid() no sea null (el usuario debe estar logueado)
--            Verificar que exista un registro en profiles para ese auth.uid()

-- 9.5. Error: column "user_id" of relation "xxx" contains null values
--   Causa: Se intenta agregar NOT NULL a user_id pero hay registros con NULL
--   Solución: Actualizar registros existentes o cambiar la constraint
