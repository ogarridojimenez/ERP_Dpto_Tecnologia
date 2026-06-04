-- Desactivar trigger de auto-profile si existe (para evitar duplicados)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DO $$
DECLARE
  v_id uuid;
  v_now timestamptz := now();
BEGIN
  -- Admin
  v_id := gen_random_uuid();
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, is_sso_user, is_anonymous)
  VALUES (v_id, 'admin@sitrade.uci.cu', crypt('Admin2026!', gen_salt('bf')), v_now, v_now, '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Sistema","role":"admin"}', 'authenticated', 'authenticated', v_now, v_now, false, false);
  INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (v_id::text, v_id, format('{"sub":"%s","email":"admin@sitrade.uci.cu"}', v_id)::jsonb, 'email', v_now, v_now, v_now);
  INSERT INTO public.profiles (id, nombre_completo, role) VALUES (v_id, 'Admin Sistema', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', nombre_completo = 'Admin Sistema';
  RAISE NOTICE '✓ admin: %', v_id;

  -- Jefe
  v_id := gen_random_uuid();
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, is_sso_user, is_anonymous)
  VALUES (v_id, 'jefe@sitrade.uci.cu', crypt('Jefe2026!', gen_salt('bf')), v_now, v_now, '{"provider":"email","providers":["email"]}', '{"full_name":"Ricardo Jefatura","role":"jefe"}', 'authenticated', 'authenticated', v_now, v_now, false, false);
  INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (v_id::text, v_id, format('{"sub":"%s","email":"jefe@sitrade.uci.cu"}', v_id)::jsonb, 'email', v_now, v_now, v_now);
  INSERT INTO public.profiles (id, nombre_completo, role) VALUES (v_id, 'Ricardo Jefatura', 'jefe')
  ON CONFLICT (id) DO UPDATE SET role = 'jefe', nombre_completo = 'Ricardo Jefatura';
  RAISE NOTICE '✓ jefe: %', v_id;

  -- RRHH
  v_id := gen_random_uuid();
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, is_sso_user, is_anonymous)
  VALUES (v_id, 'rrhh@sitrade.uci.cu', crypt('Rrhh2026!', gen_salt('bf')), v_now, v_now, '{"provider":"email","providers":["email"]}', '{"full_name":"Marta RRHH","role":"rrhh"}', 'authenticated', 'authenticated', v_now, v_now, false, false);
  INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (v_id::text, v_id, format('{"sub":"%s","email":"rrhh@sitrade.uci.cu"}', v_id)::jsonb, 'email', v_now, v_now, v_now);
  INSERT INTO public.profiles (id, nombre_completo, role) VALUES (v_id, 'Marta RRHH', 'rrhh')
  ON CONFLICT (id) DO UPDATE SET role = 'rrhh', nombre_completo = 'Marta RRHH';
  RAISE NOTICE '✓ rrhh: %', v_id;

  -- Tecnico 1
  v_id := gen_random_uuid();
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, is_sso_user, is_anonymous)
  VALUES (v_id, 'tecnico1@sitrade.uci.cu', crypt('Tecnico2026!', gen_salt('bf')), v_now, v_now, '{"provider":"email","providers":["email"]}', '{"full_name":"Javier Tecnico","role":"tecnico"}', 'authenticated', 'authenticated', v_now, v_now, false, false);
  INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (v_id::text, v_id, format('{"sub":"%s","email":"tecnico1@sitrade.uci.cu"}', v_id)::jsonb, 'email', v_now, v_now, v_now);
  INSERT INTO public.profiles (id, nombre_completo, role) VALUES (v_id, 'Javier Tecnico', 'tecnico')
  ON CONFLICT (id) DO UPDATE SET role = 'tecnico', nombre_completo = 'Javier Tecnico';
  RAISE NOTICE '✓ tecnico1: %', v_id;

  -- Tecnico 2
  v_id := gen_random_uuid();
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, is_sso_user, is_anonymous)
  VALUES (v_id, 'tecnico2@sitrade.uci.cu', crypt('Tecnico2026!', gen_salt('bf')), v_now, v_now, '{"provider":"email","providers":["email"]}', '{"full_name":"Pedro Tecnico","role":"tecnico"}', 'authenticated', 'authenticated', v_now, v_now, false, false);
  INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (v_id::text, v_id, format('{"sub":"%s","email":"tecnico2@sitrade.uci.cu"}', v_id)::jsonb, 'email', v_now, v_now, v_now);
  INSERT INTO public.profiles (id, nombre_completo, role) VALUES (v_id, 'Pedro Tecnico', 'tecnico')
  ON CONFLICT (id) DO UPDATE SET role = 'tecnico', nombre_completo = 'Pedro Tecnico';
  RAISE NOTICE '✓ tecnico2: %', v_id;
END;
$$;
