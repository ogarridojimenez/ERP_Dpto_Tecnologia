-- ============================================================================
-- Aulas - Fix RLS Policies (P1 del PLAN_FASES)
-- Fecha: 2026-06-30
-- Descripcion: Amplia policies de locales para incluir especialista_hardware,
--              amplia visitas_aulas SELECT para incluir tecnico,
--              y elimina policies duplicadas en detalles_visita.
-- ============================================================================

-- 1. LOCALES: agregar especialista_hardware a INSERT/UPDATE/DELETE
--    (ROLES.AULAS_ADMIN incluye especialista_hardware, pero las policies solo
--     admitian admin/jefe)

DROP POLICY IF EXISTS locales_insert ON locales;
CREATE POLICY locales_insert ON locales
  FOR INSERT TO authenticated
  WITH CHECK (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text, 'especialista_hardware'::text]));

DROP POLICY IF EXISTS locales_update ON locales;
CREATE POLICY locales_update ON locales
  FOR UPDATE TO authenticated
  USING (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text, 'especialista_hardware'::text]));

DROP POLICY IF EXISTS locales_delete ON locales;
CREATE POLICY locales_delete ON locales
  FOR DELETE TO authenticated
  USING (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text, 'especialista_hardware'::text]));

-- 2. VISITAS_AULAS: agregar tecnico al SELECT
--    (el rol tecnico accede al modulo Aulas en la UI y necesita ver todas
--     las sesiones, no solo las propias)

DROP POLICY IF EXISTS visitas_select_own ON visitas_aulas;
CREATE POLICY visitas_select_own ON visitas_aulas
  FOR SELECT TO authenticated
  USING (
    (auth.uid() = user_id AND deleted_at IS NULL)
    OR user_role() = ANY (ARRAY['admin'::text, 'jefe'::text, 'especialista_hardware'::text, 'tecnico'::text])
  );

-- 3. DETALLES_VISITA: eliminar policies duplicadas que el schema original
--    tenia (dos bloques con el mismo nombre, el segundo pisaba al primero)
--    y unificar criterio de roles consistente con visitas_aulas

DROP POLICY IF EXISTS detalles_visita_select_own ON detalles_visita;
CREATE POLICY detalles_visita_select_own ON detalles_visita
  FOR SELECT TO authenticated
  USING (
    (auth.uid() = user_id AND deleted_at IS NULL)
    OR user_role() = ANY (ARRAY['admin'::text, 'jefe'::text, 'especialista_hardware'::text, 'tecnico'::text])
  );

DROP POLICY IF EXISTS detalles_visita_insert_own ON detalles_visita;
CREATE POLICY detalles_visita_insert_own ON detalles_visita
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS detalles_visita_update_own ON detalles_visita;
CREATE POLICY detalles_visita_update_own ON detalles_visita
  FOR UPDATE TO authenticated
  USING (
    (auth.uid() = user_id)
    OR user_role() = ANY (ARRAY['admin'::text, 'jefe'::text, 'especialista_hardware'::text])
  );

DROP POLICY IF EXISTS detalles_visita_delete_own ON detalles_visita;
CREATE POLICY detalles_visita_delete_own ON detalles_visita
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR user_role() = ANY (ARRAY['admin'::text, 'jefe'::text])
  );

-- 4. MEDIOS: agregar especialista_hardware a DELETE
--    (consistente con INSERT/UPDATE que ya lo incluian)

DROP POLICY IF EXISTS medios_delete ON medios;
CREATE POLICY medios_delete ON medios
  FOR DELETE TO authenticated
  USING (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text, 'especialista_hardware'::text]));
