-- ============================================================================
-- SITRADE — Setup LOCAL
-- Ayudante: este archivo se conecta a sitrade y prepara todo.
-- Ejecutar con: psql -U postgres -d sitrade -f local-setup.sql
-- Luego ejecutar: psql -U postgres -d sitrade -f supabase-schema.sql
-- ============================================================================

-- 1. Crear schema auth (simula Supabase Auth)
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

INSERT INTO auth.users (id, email) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@sitrade.local'),
    ('00000000-0000-0000-0000-000000000002', 'jefe@sitrade.local'),
    ('00000000-0000-0000-0000-000000000003', 'rrhh@sitrade.local'),
    ('00000000-0000-0000-0000-000000000004', 'tecnico1@sitrade.local'),
    ('00000000-0000-0000-0000-000000000005', 'tecnico2@sitrade.local');

-- 2. Funciones compatibles con Supabase
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(
        current_setting('app.current_user_id', true),
        '00000000-0000-0000-0000-000000000001'
    )::uuid;
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
    SELECT 'authenticated';
$$;

-- 3. Crear la función user_role() (en public, compatible con schema Supabase)
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.current_user_role', true),
    (SELECT role FROM profiles WHERE id = auth.uid()),
    'admin'
  );
END;
$$;

-- 4. user_organization_id (compatible con Supabase)
CREATE OR REPLACE FUNCTION public.user_organization_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT organization_id FROM profiles WHERE id = auth.uid());
END;
$$;

-- 5. Configurar search_path
ALTER DATABASE sitrade SET search_path TO public, auth;
