import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/types/database";
import { RoleGuard } from "@/components/RoleGuard";
import { AreasClient, type AreaRow } from "./areas-client";

export const dynamic = "force-dynamic";

const AFT_ADMIN_ROLES: ProfileRole[] = ["admin", "jefe"];

export default async function AreasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, areasRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .is("deleted_at", null)
      .single(),
    supabase
      .from("areas_aft")
      .select("id, codigo, nombre, activo, created_at, mb_area(count)")
      .is("deleted_at", null)
      .order("codigo"),
  ]);

  const userRole = (profileRes.data?.role ?? "tecnico") as ProfileRole;

  const initialAreas: AreaRow[] = (areasRes.data ?? []).map((a) => ({
    id: a.id as string,
    codigo: a.codigo as string,
    nombre: a.nombre as string,
    activo: a.activo as boolean,
    created_at: a.created_at as string,
    mb_count: ((a as { mb_area?: { count: number }[] }).mb_area?.[0]?.count) ?? 0,
  }));

  return (
    <RoleGuard userRole={userRole} allowedRoles={AFT_ADMIN_ROLES}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Áreas de Responsabilidad</h1>
            <p className="text-sm text-gray-500">Catálogo manual de áreas auditables</p>
          </div>
          <Link
            href="/aft/areas/nueva"
            className="self-start rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 sm:self-auto"
          >
            ➕ Nueva Área
          </Link>
        </div>

        <AreasClient initialAreas={initialAreas} />
      </div>
    </RoleGuard>
  );
}
