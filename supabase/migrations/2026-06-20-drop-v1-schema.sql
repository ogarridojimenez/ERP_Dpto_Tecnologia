-- ============================================================================
-- Eliminar schema v1 obsoleto (P8 del PLAN_FASES)
-- Fecha de aplicacion: 2026-06-20
-- ============================================================================
-- Las 5 tablas del modelo v1 estaban vacias (0 filas cada una, verificado
-- antes de aplicar). En lugar de moverlas a schema legacy, se dropean
-- directamente. Es la opcion mas limpia para datos inexistentes.
--
-- Modelo activo es v2:
--   areas_aft + controles_aft + activos_aft + guardia_*
--
-- Pre-flight aplicado:
-- 1. SELECT COUNT(*) en cada tabla -> todas 0 filas.
-- 2. SELECT pg_constraint -> solo FKs internas entre v1
--    (movimientos_activos.activo_id -> activos.id ON DELETE CASCADE,
--     detalles_control.activo_id   -> activos.id ON DELETE RESTRICT).
--    Ninguna tabla activa (areas_aft, controles_aft, guardia_*) depende.
--
-- Aplicado via SQL Editor de Supabase Dashboard.
-- ============================================================================

BEGIN;

DROP TABLE IF EXISTS
  public.movimientos_activos,
  public.detalles_control,
  public.activos,
  public.incidencias,
  public.observaciones_guardia
CASCADE;

-- Notificar al cache de PostgREST para que descubra el cambio.
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- No es trivial: las tablas tenian indices, RLS policies y triggers que
-- no se preservan tras el DROP. Si fuera necesario reconstruirlas, ejecutar
-- el bloque relevante de supabase-schema.sql en una version anterior del
-- repo. Dado que estaban vacias, el rollback solo recuperaria la estructura,
-- no datos.
-- ============================================================================
