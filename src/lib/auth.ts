import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { ProfileRole } from "@/types/database";

type SupabaseUser = Awaited<ReturnType<typeof createClient>>;

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export type AuthContext = {
  supabase: SupabaseUser;
  user: { id: string; email?: string };
  role: ProfileRole;
};

export function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError("No autenticado");

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile?.role) {
    throw new AuthError("Perfil sin rol asignado");
  }

  return {
    supabase,
    user: { id: user.id, email: user.email },
    role: profile.role as ProfileRole,
  };
}

export async function requireRole(allowedRoles: ProfileRole[]): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!allowedRoles.includes(ctx.role)) {
    throw new AuthError(
      `Acceso denegado. Se requiere uno de estos roles: ${allowedRoles.join(", ")}`
    );
  }
  return ctx;
}

export function canDo(role: ProfileRole, allowedRoles: ProfileRole[]): boolean {
  return allowedRoles.includes(role);
}

export const ROLES = {
  AFT_ADMIN: ["admin", "jefe"] as ProfileRole[],
  AULAS_ADMIN: ["admin", "jefe", "especialista_hardware"] as ProfileRole[],
  GUARDIA_WRITE: ["admin", "jefe", "tecnico"] as ProfileRole[],
  GUARDIA_DELETE: ["admin", "jefe"] as ProfileRole[],
  ANY_AUTHENTICATED: ["admin", "jefe", "rrhh", "tecnico", "especialista_hardware"] as ProfileRole[],
};
