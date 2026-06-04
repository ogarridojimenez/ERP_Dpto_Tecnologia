-- 1. Agregar columna revisor a visitas_aulas
ALTER TABLE visitas_aulas ADD COLUMN IF NOT EXISTS revisor text NOT NULL DEFAULT '';

-- 2. Actualizar CHECK constraint de profiles para incluir especialista_hardware
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'jefe', 'rrhh', 'tecnico', 'especialista_hardware'));

-- 3. RLS policies para especialista_hardware en medios
DROP POLICY IF EXISTS "medios_insert" ON medios;
DROP POLICY IF EXISTS "medios_update" ON medios;
CREATE POLICY "medios_insert" ON medios FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe', 'tecnico', 'especialista_hardware'));
CREATE POLICY "medios_update" ON medios FOR UPDATE USING (user_role() IN ('admin', 'jefe', 'tecnico', 'especialista_hardware'));

-- 4. RLS policies para especialista_hardware en visitas_aulas
DROP POLICY IF EXISTS "visitas_select_own" ON visitas_aulas;
DROP POLICY IF EXISTS "visitas_update_own" ON visitas_aulas;
CREATE POLICY "visitas_select_own" ON visitas_aulas FOR SELECT USING (
  (auth.uid() = user_id AND deleted_at IS NULL)
  OR user_role() IN ('admin', 'jefe', 'especialista_hardware')
);
CREATE POLICY "visitas_update_own" ON visitas_aulas FOR UPDATE USING (
  (auth.uid() = user_id)
  OR user_role() IN ('admin', 'jefe', 'especialista_hardware')
);

-- 5. RLS policies para especialista_hardware en detalles_visita
DROP POLICY IF EXISTS "detalles_visita_select_own" ON detalles_visita;
DROP POLICY IF EXISTS "detalles_visita_update_own" ON detalles_visita;
CREATE POLICY "detalles_visita_select_own" ON detalles_visita FOR SELECT USING (
  (auth.uid() = user_id AND deleted_at IS NULL)
  OR user_role() IN ('admin', 'jefe', 'especialista_hardware')
);
CREATE POLICY "detalles_visita_update_own" ON detalles_visita FOR UPDATE USING (
  (auth.uid() = user_id)
  OR user_role() IN ('admin', 'jefe', 'especialista_hardware')
);

-- 6. RLS policies para especialista_hardware en incidencias
DROP POLICY IF EXISTS "incidencias_select" ON incidencias;
DROP POLICY IF EXISTS "incidencias_update" ON incidencias;
CREATE POLICY "incidencias_select" ON incidencias FOR SELECT USING (
  (auth.uid() = user_id AND deleted_at IS NULL)
  OR user_role() IN ('admin', 'jefe', 'especialista_hardware')
);
CREATE POLICY "incidencias_update" ON incidencias FOR UPDATE USING (
  auth.uid() = user_id
  OR user_role() IN ('admin', 'jefe', 'especialista_hardware')
);
