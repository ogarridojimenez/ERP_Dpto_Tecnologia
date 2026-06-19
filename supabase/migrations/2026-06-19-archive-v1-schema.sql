-- ============================================================================
-- Archivar schema v1 obsoleto (P8 del PLAN_FASES)
-- Fecha: 2026-06-19
-- Descripcion: Las 5 tablas del modelo v1 ya no son escritas por la app:
--   - activos
--   - movimientos_activos
--   - detalles_control
--   - incidencias
--   - observaciones_guardia
-- El modelo activo es v2 (areas_aft + controles_aft + activos_aft + guardia_*).
--
-- Esta migracion mueve las 5 tablas a un schema "legacy" para que:
-- 1. No aparezcan en el cliente Supabase JS por defecto (solo schema public).
-- 2. Los datos se preserven por si se necesitan para auditoria/reporting.
-- 3. Sea trivial revertir si surgen referencias ocultas.
--
-- ATENCION antes de aplicar:
-- - Verificar que NINGUNA server action ni RLS policy referencia
--   estas tablas (grep en src/ ya lo confirma a fecha de hoy).
-- - Verificar que no hay vistas, foreign keys ni triggers externos
--   apuntando a ellas: SELECT * FROM pg_depend WHERE refobjid IN
--     (SELECT oid FROM pg_class WHERE relname IN ('activos', ...));
-- - Hacer backup de las tablas antes (pg_dump --schema=public -t activos ...).
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS legacy;

-- 1. Mover tablas. ALTER TABLE ... SET SCHEMA preserva datos, indices,
--    constraints y RLS policies (aunque se vuelven invisibles via PostgREST
--    porque por defecto solo expone schemas listados en db.schema config).
ALTER TABLE IF EXISTS public.activos               SET SCHEMA legacy;
ALTER TABLE IF EXISTS public.movimientos_activos   SET SCHEMA legacy;
ALTER TABLE IF EXISTS public.detalles_control      SET SCHEMA legacy;
ALTER TABLE IF EXISTS public.incidencias           SET SCHEMA legacy;
ALTER TABLE IF EXISTS public.observaciones_guardia SET SCHEMA legacy;

-- 2. Revoke acceso por defecto al schema legacy para los roles de la API.
--    Solo el rol postgres / service_role mantendra acceso.
REVOKE ALL ON SCHEMA legacy FROM anon, authenticated;

-- 3. Notificar al cache de PostgREST para que descubra el cambio.
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- ROLLBACK (no se aplica automaticamente; ejecutar manualmente si hace falta)
-- ============================================================================
-- ALTER TABLE IF EXISTS legacy.activos               SET SCHEMA public;
-- ALTER TABLE IF EXISTS legacy.movimientos_activos   SET SCHEMA public;
-- ALTER TABLE IF EXISTS legacy.detalles_control      SET SCHEMA public;
-- ALTER TABLE IF EXISTS legacy.incidencias           SET SCHEMA public;
-- ALTER TABLE IF EXISTS legacy.observaciones_guardia SET SCHEMA public;
-- DROP SCHEMA IF EXISTS legacy;
-- NOTIFY pgrst, 'reload schema';
