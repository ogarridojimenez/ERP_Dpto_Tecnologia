-- ============================================================================
-- AFT v2 - Restringir RLS anon en activos_aft (P4 del PLAN_FASES)
-- Fecha: 2026-06-19
-- Descripcion: Antes, anon podia SELECT toda la tabla activos_aft. Ahora solo
--              ve activos cuyo control padre esta en estado 'en_curso' (no
--              completado ni cancelado) y no borrado. Reduce la superficie
--              expuesta a quien tenga la anon_key (embebida en app movil).
--
-- IMPORTANTE: Antes de aplicar esta migracion verificar con el equipo de
-- la app movil (apps/mobile) que solo necesitan datos de controles activos.
-- Si la app tambien lista historicos sin login, ajustar el filtro o migrar
-- a auth real (preferido a medio plazo: TO authenticated USING auth.uid()
-- IS NOT NULL).
-- ============================================================================

-- 1. activos_aft: reemplazar el SELECT abierto por uno restringido.
DROP POLICY IF EXISTS activos_aft_select_anon ON activos_aft;

CREATE POLICY activos_aft_select_anon_active ON activos_aft
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM controles_aft c
      WHERE c.id = activos_aft.control_id
        AND c.deleted_at IS NULL
        AND c.estado = 'en_curso'
    )
  );

-- 2. controles_aft: igual de estricto — solo controles 'en_curso' visibles
--    para anon. Mantiene el filtro deleted_at IS NULL.
DROP POLICY IF EXISTS controles_aft_select_anon ON controles_aft;

CREATE POLICY controles_aft_select_anon_active ON controles_aft
  FOR SELECT TO anon
  USING (
    deleted_at IS NULL
    AND estado = 'en_curso'
  );

-- 3. areas_aft: dejar como esta — solo es metadata (nombre, codigo) y la app
--    movil la necesita siempre para resolver joins. No es sensible.
--    Si en el futuro se quiere endurecer: filtrar por organization del control
--    visible al anon. Por ahora, NO se toca.
