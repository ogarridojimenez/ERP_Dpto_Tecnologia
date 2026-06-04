-- ============================================================================
-- AFT v2 - RLS Policies Fix
-- Fecha: 2026-06-03
-- Descripción: Agrega políticas RLS faltantes para tablas del módulo AFT v2
--               y completa las de controles_aft (faltaban INSERT/UPDATE).
-- ============================================================================

-- 1. Tabla: areas_aft
DROP POLICY IF EXISTS areas_aft_select ON areas_aft;
CREATE POLICY areas_aft_select ON areas_aft
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS areas_aft_insert ON areas_aft;
CREATE POLICY areas_aft_insert ON areas_aft
  FOR INSERT TO authenticated
  WITH CHECK (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text]));

DROP POLICY IF EXISTS areas_aft_update ON areas_aft;
CREATE POLICY areas_aft_update ON areas_aft
  FOR UPDATE TO authenticated
  USING (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text]));

DROP POLICY IF EXISTS areas_aft_delete ON areas_aft;
CREATE POLICY areas_aft_delete ON areas_aft
  FOR DELETE TO authenticated
  USING (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text]));

-- 2. Tabla: mb_area
DROP POLICY IF EXISTS mb_area_select ON mb_area;
CREATE POLICY mb_area_select ON mb_area
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS mb_area_insert ON mb_area;
CREATE POLICY mb_area_insert ON mb_area
  FOR INSERT TO authenticated
  WITH CHECK (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text, 'tecnico'::text]));

DROP POLICY IF EXISTS mb_area_update ON mb_area;
CREATE POLICY mb_area_update ON mb_area
  FOR UPDATE TO authenticated
  USING (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text, 'tecnico'::text]));

DROP POLICY IF EXISTS mb_area_delete ON mb_area;
CREATE POLICY mb_area_delete ON mb_area
  FOR DELETE TO authenticated
  USING (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text]));

-- 3. Tabla: activos_aft
DROP POLICY IF EXISTS activos_aft_select ON activos_aft;
CREATE POLICY activos_aft_select ON activos_aft
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS activos_aft_insert ON activos_aft;
CREATE POLICY activos_aft_insert ON activos_aft
  FOR INSERT TO authenticated
  WITH CHECK (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text, 'tecnico'::text]));

DROP POLICY IF EXISTS activos_aft_update ON activos_aft;
CREATE POLICY activos_aft_update ON activos_aft
  FOR UPDATE TO authenticated
  USING (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text, 'tecnico'::text]));

DROP POLICY IF EXISTS activos_aft_delete ON activos_aft;
CREATE POLICY activos_aft_delete ON activos_aft
  FOR DELETE TO authenticated
  USING (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text]));

-- 4. Tabla: controles_aft (completar INSERT y UPDATE que faltaban)
DROP POLICY IF EXISTS controles_insert ON controles_aft;
CREATE POLICY controles_insert ON controles_aft
  FOR INSERT TO authenticated
  WITH CHECK (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text]));

DROP POLICY IF EXISTS controles_update ON controles_aft;
CREATE POLICY controles_update ON controles_aft
  FOR UPDATE TO authenticated
  USING (user_role() = ANY (ARRAY['admin'::text, 'jefe'::text, 'tecnico'::text]));

-- 5. Función user_role() debe existir (ya existe según las otras políticas)
--    Solo nos aseguramos de que está disponible.
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'user_role') THEN
    EXECUTE $func$
      CREATE FUNCTION public.user_role() RETURNS text
      LANGUAGE sql STABLE SECURITY DEFINER
      SET search_path = public
      AS $body$
        SELECT role::text FROM public.profiles WHERE id = auth.uid() AND deleted_at IS NULL LIMIT 1;
      $body$;
    $func$;
  END IF;
END $do$;
