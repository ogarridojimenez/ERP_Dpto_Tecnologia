-- ============================================================================
-- AFT: Función RPC para sincronizar escaneos desde la app móvil
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_inventory_scans(
  p_control_id uuid,
  p_scans jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_locale_id uuid;
  v_scan jsonb;
  v_presente boolean;
  v_observaciones text;
  v_assets_to_update uuid[];
  v_assets_to_update_malo uuid[];
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- Get control's locale
  SELECT locale_id INTO v_locale_id
  FROM controles_aft
  WHERE id = p_control_id AND deleted_at IS NULL;

  IF v_locale_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Control no encontrado');
  END IF;

  -- Process each scan
  v_assets_to_update := ARRAY[]::uuid[];

  FOR v_scan IN SELECT * FROM jsonb_array_elements(p_scans)
  LOOP
    v_presente := (v_scan->>'presente')::boolean;
    v_observaciones := v_scan->>'observaciones';

    -- Insert/update detalle_control
    INSERT INTO detalles_control (
      control_id, activo_id, presente, estado_observado, observaciones, user_id
    )
    VALUES (
      p_control_id,
      (v_scan->>'activo_id')::uuid,
      COALESCE(v_presente, true),
      (v_scan->>'estado_observado')::text,
      v_observaciones,
      v_user_id
    )
    ON CONFLICT (control_id, activo_id) DO UPDATE SET
      presente = EXCLUDED.presente,
      estado_observado = EXCLUDED.estado_observado,
      observaciones = EXCLUDED.observaciones,
      updated_at = now();

    -- Track assets marked as present for updating ultimo_control_date
    IF COALESCE(v_presente, true) THEN
      v_assets_to_update := array_append(v_assets_to_update, (v_scan->>'activo_id')::uuid);
    END IF;
  END LOOP;

  -- Update ultimo_control_date on found assets
  IF array_length(v_assets_to_update, 1) > 0 THEN
    UPDATE activos
    SET ultimo_control_date = CURRENT_DATE
    WHERE id = ANY(v_assets_to_update)
      AND deleted_at IS NULL;
  END IF;

  -- Mark control as en_curso (will be marcado completado from admin)
  UPDATE controles_aft
  SET estado = 'en_curso'
  WHERE id = p_control_id
    AND estado = 'planificado';

  RETURN jsonb_build_object(
    'success', true,
    'synced', jsonb_array_length(p_scans),
    'control_id', p_control_id
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION sync_inventory_scans TO authenticated;
