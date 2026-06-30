-- Seed para tests E2E
-- Ejecutar en la consola SQL de Supabase (SQL Editor)
-- Copia los IDs de auth.users reales antes de ejecutar

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Reemplazar con un UUID real de un usuario existente en auth.users
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No hay usuarios en auth.users. Crea al menos un usuario primero.';
  END IF;

  -- Locales de prueba (si no existen)
  INSERT INTO locales (id, codigo, nombre, tipo, user_id)
  SELECT g, CONCAT('E2E-', LPAD(ROW_NUMBER() OVER (), 3, '0')), CONCAT('Local E2E ', ROW_NUMBER() OVER ()), 'aula', v_user_id
  FROM generate_series(1, 5) g
  WHERE NOT EXISTS (SELECT 1 FROM locales WHERE codigo LIKE 'E2E-%');
END $$;
