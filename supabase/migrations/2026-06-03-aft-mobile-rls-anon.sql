-- ============================================================================
-- AFT v2 - RLS Policies for Mobile App (anon role)
-- Fecha: 2026-06-03
-- Descripcion: Agrega SELECT para rol anon en tablas AFT para que la app
--               movil (sin login, usa anon key) pueda leer controles y activos.
-- ============================================================================

-- 1. controles_aft: permitir SELECT a anon (app movil necesita ver controles)
DROP POLICY IF EXISTS controles_aft_select_anon ON controles_aft;
CREATE POLICY controles_aft_select_anon ON controles_aft
  FOR SELECT TO anon
  USING (deleted_at IS NULL);

-- 2. areas_aft: permitir SELECT a anon (app movil necesita ver areas via join)
DROP POLICY IF EXISTS areas_aft_select_anon ON areas_aft;
CREATE POLICY areas_aft_select_anon ON areas_aft
  FOR SELECT TO anon
  USING (deleted_at IS NULL);

-- 3. activos_aft: permitir SELECT a anon (app movil necesita descargar activos)
DROP POLICY IF EXISTS activos_aft_select_anon ON activos_aft;
CREATE POLICY activos_aft_select_anon ON activos_aft
  FOR SELECT TO anon
  USING (true);
