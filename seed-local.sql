-- ============================================================================
-- SITRADE — Seed para LOCAL
-- Usa los UUID de auth.users creados en local-setup.sql
-- Ejecutar DESPUÉS de supabase-schema.sql
-- ============================================================================

-- Admin seed: reemplaza con un UUID real de auth.users
-- En local: 00000000-0000-0000-0000-000000000001 (admin@sitrade.local)
-- En Supabase: reemplázalo con el UUID del admin real

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Intentar obtener un usuario admin de auth.users
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at LIMIT 1;

  -- Si no hay usuarios en auth.users, crear uno
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (id, email) VALUES
      (gen_random_uuid(), 'seed-admin@sitrade.local')
      RETURNING id INTO v_user_id;
    RAISE NOTICE 'Creado usuario seed: %', v_user_id;
  END IF;

  RAISE NOTICE 'Usando user_id: %', v_user_id;

  -- Locales
  INSERT INTO locales (id, organization_id, codigo, nombre, tipo, edificio, piso, user_id) VALUES
    ('a0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'A101', 'Aula 101', 'aula', 'Edificio Docente', 1, v_user_id),
    ('a0000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'A102', 'Aula 102', 'aula', 'Edificio Docente', 1, v_user_id),
    ('a0000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'LB201', 'Laboratorio Básico 201', 'laboratorio', 'Edificio Docente', 2, v_user_id),
    ('a0000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'LB202', 'Laboratorio Básico 202', 'laboratorio', 'Edificio Docente', 2, v_user_id),
    ('a0000001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'LC301', 'Laboratorio de Ciberseguridad 301', 'laboratorio', 'Edificio Docente', 3, v_user_id),
    ('a0000001-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'OFI01', 'Oficina Jefatura', 'oficina', 'Edificio Docente', 1, v_user_id),
    ('a0000001-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'ALM01', 'Almacén de Tecnología', 'almacen', 'Edificio Docente', 0, v_user_id)
  ON CONFLICT (codigo) DO NOTHING;

  -- Tipos de medio
  INSERT INTO tipos_medio (id, organization_id, nombre, categoria, user_id) VALUES
    ('b0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Computadora', 'equipo_principal', v_user_id),
    ('b0000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Monitor', 'periferico', v_user_id),
    ('b0000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Teclado', 'periferico', v_user_id),
    ('b0000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Mouse', 'periferico', v_user_id),
    ('b0000001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Televisor', 'equipo_principal', v_user_id),
    ('b0000001-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Datachow (Proyector)', 'equipo_principal', v_user_id),
    ('b0000001-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Televiewer', 'equipo_principal', v_user_id),
    ('b0000001-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'UPS', 'periferico', v_user_id),
    ('b0000001-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Cable de Red', 'cableado', v_user_id),
    ('b0000001-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Cable de Corriente', 'cableado', v_user_id)
  ON CONFLICT (nombre) DO NOTHING;

  -- Cargos
  INSERT INTO cargos (id, organization_id, nombre, descripcion, nivel, user_id) VALUES
    ('c0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Jefe de Departamento', 'Responsable del departamento de tecnología', 5, v_user_id),
    ('c0000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Especialista RRHH', 'Gestión de recursos humanos departamental', 4, v_user_id),
    ('c0000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Técnico en Informática', 'Soporte técnico y mantenimiento de laboratorios', 3, v_user_id),
    ('c0000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Técnico de Activos Fijos', 'Control y gestión de activos fijos tangibles', 3, v_user_id),
    ('c0000001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Administrador de Red', 'Gestión de infraestructura de red', 4, v_user_id)
  ON CONFLICT (nombre) DO NOTHING;

  RAISE NOTICE 'Seed completado exitosamente.';
END;
$$;
