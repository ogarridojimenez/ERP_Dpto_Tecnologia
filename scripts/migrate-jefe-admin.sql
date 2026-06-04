-- Migración: jefe tiene mismos permisos que admin
-- Se dropean y recrean las policies donde jefe estaba restringido

-- organizations
DROP POLICY IF EXISTS "org_insert_admin" ON organizations;
DROP POLICY IF EXISTS "org_update_admin" ON organizations;
DROP POLICY IF EXISTS "org_delete_admin" ON organizations;
CREATE POLICY "org_insert_admin" ON organizations FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe'));
CREATE POLICY "org_update_admin" ON organizations FOR UPDATE USING (user_role() IN ('admin', 'jefe'));
CREATE POLICY "org_delete_admin" ON organizations FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- profiles
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id OR user_role() IN ('admin', 'jefe'));
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- locales
DROP POLICY IF EXISTS "locales_insert" ON locales;
DROP POLICY IF EXISTS "locales_update" ON locales;
DROP POLICY IF EXISTS "locales_delete" ON locales;
CREATE POLICY "locales_insert" ON locales FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe'));
CREATE POLICY "locales_update" ON locales FOR UPDATE USING (user_role() IN ('admin', 'jefe'));
CREATE POLICY "locales_delete" ON locales FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- tipos_medio
DROP POLICY IF EXISTS "tipos_medio_insert" ON tipos_medio;
DROP POLICY IF EXISTS "tipos_medio_update" ON tipos_medio;
DROP POLICY IF EXISTS "tipos_medio_delete" ON tipos_medio;
CREATE POLICY "tipos_medio_insert" ON tipos_medio FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe'));
CREATE POLICY "tipos_medio_update" ON tipos_medio FOR UPDATE USING (user_role() IN ('admin', 'jefe'));
CREATE POLICY "tipos_medio_delete" ON tipos_medio FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- medios
DROP POLICY IF EXISTS "medios_delete" ON medios;
CREATE POLICY "medios_delete" ON medios FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- visitas_aulas
DROP POLICY IF EXISTS "visitas_delete_own" ON visitas_aulas;
CREATE POLICY "visitas_delete_own" ON visitas_aulas FOR DELETE USING (auth.uid() = user_id OR user_role() IN ('admin', 'jefe'));

-- detalles_visita
DROP POLICY IF EXISTS "detalles_visita_delete_own" ON detalles_visita;
CREATE POLICY "detalles_visita_delete_own" ON detalles_visita FOR DELETE USING (auth.uid() = user_id OR user_role() IN ('admin', 'jefe'));

-- guardias
DROP POLICY IF EXISTS "guardias_delete_admin" ON guardias;
CREATE POLICY "guardias_delete_admin" ON guardias FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- observaciones_guardia
DROP POLICY IF EXISTS "obs_guardia_delete_admin" ON observaciones_guardia;
CREATE POLICY "obs_guardia_delete_admin" ON observaciones_guardia FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- incidencias
DROP POLICY IF EXISTS "incidencias_delete_admin" ON incidencias;
CREATE POLICY "incidencias_delete_admin" ON incidencias FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- cargos
DROP POLICY IF EXISTS "cargos_insert" ON cargos;
DROP POLICY IF EXISTS "cargos_update" ON cargos;
DROP POLICY IF EXISTS "cargos_delete_admin" ON cargos;
CREATE POLICY "cargos_insert" ON cargos FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe'));
CREATE POLICY "cargos_update" ON cargos FOR UPDATE USING (user_role() IN ('admin', 'jefe'));
CREATE POLICY "cargos_delete_admin" ON cargos FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- trabajadores
DROP POLICY IF EXISTS "trabajadores_insert" ON trabajadores;
DROP POLICY IF EXISTS "trabajadores_update" ON trabajadores;
DROP POLICY IF EXISTS "trabajadores_delete_admin" ON trabajadores;
CREATE POLICY "trabajadores_insert" ON trabajadores FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe', 'rrhh'));
CREATE POLICY "trabajadores_update" ON trabajadores FOR UPDATE USING (user_role() IN ('admin', 'jefe', 'rrhh'));
CREATE POLICY "trabajadores_delete_admin" ON trabajadores FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- horarios
DROP POLICY IF EXISTS "horarios_insert" ON horarios;
DROP POLICY IF EXISTS "horarios_update" ON horarios;
DROP POLICY IF EXISTS "horarios_delete_admin" ON horarios;
CREATE POLICY "horarios_insert" ON horarios FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe', 'rrhh'));
CREATE POLICY "horarios_update" ON horarios FOR UPDATE USING (user_role() IN ('admin', 'jefe', 'rrhh'));
CREATE POLICY "horarios_delete_admin" ON horarios FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- hojas_firma
DROP POLICY IF EXISTS "hojas_firma_insert" ON hojas_firma;
DROP POLICY IF EXISTS "hojas_firma_update" ON hojas_firma;
DROP POLICY IF EXISTS "hojas_firma_delete_admin" ON hojas_firma;
CREATE POLICY "hojas_firma_insert" ON hojas_firma FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe', 'rrhh'));
CREATE POLICY "hojas_firma_update" ON hojas_firma FOR UPDATE USING (user_role() IN ('admin', 'jefe', 'rrhh'));
CREATE POLICY "hojas_firma_delete_admin" ON hojas_firma FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- detalles_hoja_firma
DROP POLICY IF EXISTS "detalles_firma_insert" ON detalles_hoja_firma;
DROP POLICY IF EXISTS "detalles_firma_update" ON detalles_hoja_firma;
DROP POLICY IF EXISTS "detalles_firma_delete_admin" ON detalles_hoja_firma;
CREATE POLICY "detalles_firma_insert" ON detalles_hoja_firma FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe', 'rrhh'));
CREATE POLICY "detalles_firma_update" ON detalles_hoja_firma FOR UPDATE USING (user_role() IN ('admin', 'jefe', 'rrhh'));
CREATE POLICY "detalles_firma_delete_admin" ON detalles_hoja_firma FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- prenominas
DROP POLICY IF EXISTS "prenominas_insert" ON prenominas;
DROP POLICY IF EXISTS "prenominas_update" ON prenominas;
DROP POLICY IF EXISTS "prenominas_delete_admin" ON prenominas;
CREATE POLICY "prenominas_insert" ON prenominas FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe', 'rrhh'));
CREATE POLICY "prenominas_update" ON prenominas FOR UPDATE USING (user_role() IN ('admin', 'jefe', 'rrhh'));
CREATE POLICY "prenominas_delete_admin" ON prenominas FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- activos
DROP POLICY IF EXISTS "activos_insert" ON activos;
DROP POLICY IF EXISTS "activos_update" ON activos;
DROP POLICY IF EXISTS "activos_delete_admin" ON activos;
CREATE POLICY "activos_insert" ON activos FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe', 'tecnico'));
CREATE POLICY "activos_update" ON activos FOR UPDATE USING (user_role() IN ('admin', 'jefe', 'tecnico'));
CREATE POLICY "activos_delete_admin" ON activos FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- movimientos_activos
DROP POLICY IF EXISTS "movimientos_insert" ON movimientos_activos;
DROP POLICY IF EXISTS "movimientos_update" ON movimientos_activos;
DROP POLICY IF EXISTS "movimientos_delete_admin" ON movimientos_activos;
CREATE POLICY "movimientos_insert" ON movimientos_activos FOR INSERT WITH CHECK (user_role() IN ('admin', 'jefe', 'tecnico'));
CREATE POLICY "movimientos_update" ON movimientos_activos FOR UPDATE USING (user_role() IN ('admin', 'jefe', 'tecnico'));
CREATE POLICY "movimientos_delete_admin" ON movimientos_activos FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- controles_aft
DROP POLICY IF EXISTS "controles_delete_admin" ON controles_aft;
CREATE POLICY "controles_delete_admin" ON controles_aft FOR DELETE USING (user_role() IN ('admin', 'jefe'));

-- detalles_control
DROP POLICY IF EXISTS "detalles_control_delete_admin" ON detalles_control;
CREATE POLICY "detalles_control_delete_admin" ON detalles_control FOR DELETE USING (user_role() IN ('admin', 'jefe'));
