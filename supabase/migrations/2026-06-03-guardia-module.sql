-- ============================================================================
-- Modulo de Guardia — Entrega y Recibo
-- Fecha: 2026-06-03
-- Descripcion: Tablas para el parte diario de guardia con control de
--               perifericos por area y deteccion de discrepancias.
-- ============================================================================

-- 1. AREAS DE GUARDIA (Laboratorios + Oficina del Jefe de Turno)
CREATE TABLE IF NOT EXISTS guardia_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'laboratorio', -- laboratorio | oficina
  activo BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, codigo)
);

-- 2. PERIFERICOS POR AREA (CRUD dinamico)
CREATE TABLE IF NOT EXISTS guardia_perifericos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES guardia_areas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 3. PARTES DIARIOS DE GUARDIA (1 por dia)
CREATE TABLE IF NOT EXISTS guardia_partes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'borrador', -- borrador | completado
  observaciones_generales TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, fecha)
);

-- 4. REGISTROS POR AREA (entrega + recibo)
CREATE TABLE IF NOT EXISTS guardia_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardia_parte_id UUID NOT NULL REFERENCES guardia_partes(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES guardia_areas(id),
  -- Entrega
  entregado_por_nombre TEXT,
  entregado_por_solapin TEXT,
  fecha_hora_entrega TIMESTAMPTZ,
  -- Recibo
  recibido_por_nombre TEXT,
  recibido_por_solapin TEXT,
  fecha_hora_recibo TIMESTAMPTZ,
  -- Observaciones
  observaciones TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(guardia_parte_id, area_id)
);

-- 5. DETALLE POR PERIFERICO (cantidades entrega vs recibo)
CREATE TABLE IF NOT EXISTS guardia_detalle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardia_registro_id UUID NOT NULL REFERENCES guardia_registros(id) ON DELETE CASCADE,
  periferico_id UUID NOT NULL REFERENCES guardia_perifericos(id),
  cantidad_entrega INTEGER NOT NULL DEFAULT 0,
  cantidad_recibo INTEGER NOT NULL DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(guardia_registro_id, periferico_id)
);

-- 6. INDICES
CREATE INDEX IF NOT EXISTS idx_guardia_areas_org ON guardia_areas(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_guardia_perifericos_area ON guardia_perifericos(area_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_guardia_partes_fecha ON guardia_partes(fecha) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_guardia_partes_org ON guardia_partes(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_guardia_registros_parte ON guardia_registros(guardia_parte_id);
CREATE INDEX IF NOT EXISTS idx_guardia_detalle_registro ON guardia_detalle(guardia_registro_id);

-- 7. TRIGGERS para updated_at
CREATE OR REPLACE FUNCTION update_guardia_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guardia_areas_updated ON guardia_areas;
CREATE TRIGGER trg_guardia_areas_updated
  BEFORE UPDATE ON guardia_areas
  FOR EACH ROW EXECUTE FUNCTION update_guardia_updated_at();

DROP TRIGGER IF EXISTS trg_guardia_partes_updated ON guardia_partes;
CREATE TRIGGER trg_guardia_partes_updated
  BEFORE UPDATE ON guardia_partes
  FOR EACH ROW EXECUTE FUNCTION update_guardia_updated_at();

DROP TRIGGER IF EXISTS trg_guardia_registros_updated ON guardia_registros;
CREATE TRIGGER trg_guardia_registros_updated
  BEFORE UPDATE ON guardia_registros
  FOR EACH ROW EXECUTE FUNCTION update_guardia_updated_at();

DROP TRIGGER IF EXISTS trg_guardia_detalle_updated ON guardia_detalle;
CREATE TRIGGER trg_guardia_detalle_updated
  BEFORE UPDATE ON guardia_detalle
  FOR EACH ROW EXECUTE FUNCTION update_guardia_updated_at();

-- 8. RLS POLICIES
ALTER TABLE guardia_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardia_perifericos ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardia_partes ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardia_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardia_detalle ENABLE ROW LEVEL SECURITY;

-- guardia_areas
DROP POLICY IF EXISTS guardia_areas_select ON guardia_areas;
CREATE POLICY guardia_areas_select ON guardia_areas
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

DROP POLICY IF EXISTS guardia_areas_insert ON guardia_areas;
CREATE POLICY guardia_areas_insert ON guardia_areas
  FOR INSERT TO authenticated WITH CHECK (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text]));

DROP POLICY IF EXISTS guardia_areas_update ON guardia_areas;
CREATE POLICY guardia_areas_update ON guardia_areas
  FOR UPDATE TO authenticated USING (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text]));

DROP POLICY IF EXISTS guardia_areas_delete ON guardia_areas;
CREATE POLICY guardia_areas_delete ON guardia_areas
  FOR DELETE TO authenticated USING (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text]));

-- guardia_perifericos
DROP POLICY IF EXISTS guardia_perifericos_select ON guardia_perifericos;
CREATE POLICY guardia_perifericos_select ON guardia_perifericos
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

DROP POLICY IF EXISTS guardia_perifericos_insert ON guardia_perifericos;
CREATE POLICY guardia_perifericos_insert ON guardia_perifericos
  FOR INSERT TO authenticated WITH CHECK (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text]));

DROP POLICY IF EXISTS guardia_perifericos_update ON guardia_perifericos;
CREATE POLICY guardia_perifericos_update ON guardia_perifericos
  FOR UPDATE TO authenticated USING (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text]));

DROP POLICY IF EXISTS guardia_perifericos_delete ON guardia_perifericos;
CREATE POLICY guardia_perifericos_delete ON guardia_perifericos
  FOR DELETE TO authenticated USING (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text]));

-- guardia_partes
DROP POLICY IF EXISTS guardia_partes_select ON guardia_partes;
CREATE POLICY guardia_partes_select ON guardia_partes
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

DROP POLICY IF EXISTS guardia_partes_insert ON guardia_partes;
CREATE POLICY guardia_partes_insert ON guardia_partes
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS guardia_partes_update ON guardia_partes;
CREATE POLICY guardia_partes_update ON guardia_partes
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS guardia_partes_delete ON guardia_partes;
CREATE POLICY guardia_partes_delete ON guardia_partes
  FOR DELETE TO authenticated USING (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text]));

-- guardia_registros
DROP POLICY IF EXISTS guardia_registros_select ON guardia_registros;
CREATE POLICY guardia_registros_select ON guardia_registros
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS guardia_registros_insert ON guardia_registros;
CREATE POLICY guardia_registros_insert ON guardia_registros
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS guardia_registros_update ON guardia_registros;
CREATE POLICY guardia_registros_update ON guardia_registros
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS guardia_registros_delete ON guardia_registros;
CREATE POLICY guardia_registros_delete ON guardia_registros
  FOR DELETE TO authenticated USING (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text]));

-- guardia_detalle
DROP POLICY IF EXISTS guardia_detalle_select ON guardia_detalle;
CREATE POLICY guardia_detalle_select ON guardia_detalle
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS guardia_detalle_insert ON guardia_detalle;
CREATE POLICY guardia_detalle_insert ON guardia_detalle
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS guardia_detalle_update ON guardia_detalle;
CREATE POLICY guardia_detalle_update ON guardia_detalle
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS guardia_detalle_delete ON guardia_detalle;
CREATE POLICY guardia_detalle_delete ON guardia_detalle
  FOR DELETE TO authenticated USING (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text]));

-- 9. COMENTARIOS
COMMENT ON TABLE guardia_areas IS 'Catalogo de areas para control de guardia (laboratorios y oficinas)';
COMMENT ON TABLE guardia_perifericos IS 'Perifericos configurados por area para conteo en guardia';
COMMENT ON TABLE guardia_partes IS 'Parte diario de guardia (1 por dia por organizacion)';
COMMENT ON TABLE guardia_registros IS 'Registro de entrega y recibo por area en un parte de guardia';
COMMENT ON TABLE guardia_detalle IS 'Cantidad de cada periferico en entrega vs recibo';
