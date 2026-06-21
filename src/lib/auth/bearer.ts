import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

/**
 * Verifica un Authorization: Bearer <jwt> contra Supabase Auth y devuelve
 * el userId si el token es valido; null en caso contrario.
 *
 * Usa la anon_key + el JWT del usuario (la sesion del cliente movil) para
 * delegar la verificacion a Supabase. No requiere service_role en esta capa.
 */
export async function verifyBearer(
  request: NextRequest
): Promise<{ userId: string } | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const jwt = auth.slice(7).trim();
  if (!jwt) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const supabase = createClient<Database>(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data?.user) return null;
  return { userId: data.user.id };
}

/**
 * Verifica un header X-Sync-Token contra el secreto AFT_SYNC_TOKEN del
 * servidor. Pensado como fallback para flujos offline-first donde el JWT
 * del usuario puede haber caducado.
 *
 * Devuelve true si coincide; false si no esta configurado o no coincide.
 */
export function verifySyncToken(request: NextRequest): boolean {
  const expected = process.env.AFT_SYNC_TOKEN;
  if (!expected) return false;
  const provided = request.headers.get("x-sync-token");
  if (!provided) return false;
  return timingSafeEqual(provided, expected);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
