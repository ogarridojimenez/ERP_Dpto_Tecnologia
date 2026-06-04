-- ============================================================================
-- AFT v2 Rediseño - Migración
-- Fecha: 2026-06-02
-- Descripción: Rediseño del módulo AFT basado en Áreas de Responsabilidad
-- ============================================================================

-- 1. Limpiar datos de prueba del modelo anterior
DELETE FROM detalles_control;
DELETE FROM controles_aft;
DELETE FROM movimientos_activos;
DELETE FROM activos;

-- 2. Crear tabla areas_aft
CREATE TABLE IF NOT EXISTS areas_aft (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, codigo)
);

-- 3. Crear tabla mb_area (maestro de MBs por área)
CREATE TABLE IF NOT EXISTS mb_area (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES areas_aft(id) ON DELETE CASCADE,
  mb TEXT NOT NULL,
  descripcion TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(area_id, mb)
);

-- 4. Modificar controles_aft: quitar locale_id, agregar area_id
ALTER TABLE controles_aft DROP COLUMN IF EXISTS locale_id;
ALTER TABLE controles_aft ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES areas_aft(id);
ALTER TABLE controles_aft ALTER COLUMN area_id SET NOT NULL;

-- 5. Crear tabla activos_aft (MBs esperados de un control específico)
CREATE TABLE IF NOT EXISTS activos_aft (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID NOT NULL REFERENCES controles_aft(id) ON DELETE CASCADE,
  mb TEXT NOT NULL,
  descripcion TEXT,
  escaneado BOOLEAN NOT NULL DEFAULT false,
  fecha_escaneo TIMESTAMPTZ,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(control_id, mb)
);

-- 6. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_areas_aft_org ON areas_aft(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_areas_aft_codigo ON areas_aft(codigo) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mb_area_area ON mb_area(area_id);
CREATE INDEX IF NOT EXISTS idx_mb_area_mb ON mb_area(mb);
CREATE INDEX IF NOT EXISTS idx_activos_aft_control ON activos_aft(control_id);
CREATE INDEX IF NOT EXISTS idx_activos_aft_mb ON activos_aft(mb);
CREATE INDEX IF NOT EXISTS idx_activos_aft_escaneado ON activos_aft(escaneado) WHERE escaneado = true;
CREATE INDEX IF NOT EXISTS idx_controles_aft_area ON controles_aft(area_id);
CREATE INDEX IF NOT EXISTS idx_controles_aft_estado ON controles_aft(estado);
CREATE INDEX IF NOT EXISTS idx_controles_aft_fecha ON controles_aft(fecha_planificada);

-- 7. Trigger para updated_at en areas_aft
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_areas_aft_updated_at ON areas_aft;
CREATE TRIGGER trg_areas_aft_updated_at
  BEFORE UPDATE ON areas_aft
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Comentarios
COMMENT ON TABLE areas_aft IS 'Áreas de Responsabilidad (catalogo manual)';
COMMENT ON TABLE mb_area IS 'Maestro de MBs por área (del Excel)';
COMMENT ON TABLE activos_aft IS 'MBs esperados de un control específico (snapshot al crear control)';
COMMENT ON COLUMN controles_aft.area_id IS 'Área de responsabilidad auditada';
