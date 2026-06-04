import { createClient } from "@/lib/supabase/server";
import { ProfileRole } from "@/types/database";

export type AuthResult = 
  | { authorized: true; userId: string; role: ProfileRole; organizationId: string | null }
  | { authorized: false; reason: "not_authenticated" | "insufficient_permissions"; requiredRoles?: ProfileRole[] };

export async function getCurrentUser(): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { authorized: false, reason: "not_authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .is("deleted_at", null)
    .single();

  if (!profile) {
    return { authorized: false, reason: "not_authenticated" };
  }

  return {
    authorized: true,
    userId: user.id,
    role: profile.role as ProfileRole,
    organizationId: profile.organization_id,
  };
}

export async function requireRoles(allowedRoles: ProfileRole[]): Promise<AuthResult> {
  const result = await getCurrentUser();
  
  if (!result.authorized) {
    return result;
  }

  if (!allowedRoles.includes(result.role)) {
    return {
      authorized: false,
      reason: "insufficient_permissions",
      requiredRoles: allowedRoles,
    };
  }

  return result;
}
