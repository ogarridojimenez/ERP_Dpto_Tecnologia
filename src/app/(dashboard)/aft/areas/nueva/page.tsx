"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createArea } from "@/app/actions/aft";
import { ProfileRole } from "@/types/database";
import { RoleGuard } from "@/components/RoleGuard";

const AFT_ADMIN_ROLES: ProfileRole[] = ["admin", "jefe"];

export default function NuevaAreaPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<ProfileRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).is("deleted_at", null).single();
      if (profile) setUserRole(profile.role as ProfileRole);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const res = await createArea(formData);
    if (res.success) {
      const data = res.data as { id: string };
      router.push(`/aft/areas/${data.id}`);
    } else {
      setError(res.error || "Error al crear el área");
    }
    setLoading(false);
  };

  if (!userRole) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Cargando...</div>;
  }

  return (
    <RoleGuard userRole={userRole} allowedRoles={AFT_ADMIN_ROLES}>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">Crear Área de Responsabilidad</h1>
          <p className="text-sm text-gray-500">Las áreas son unidades auditables. Después podrás subir el Excel con los MBs.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Código *</label>
            <input
              name="codigo"
              required
              minLength={1}
              maxLength={50}
              placeholder="Ej: 2000016"
              className="w-full rounded-xl border border-gray-300 p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">Identificador numérico único de la organización</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Nombre *</label>
            <input
              name="nombre"
              required
              minLength={2}
              maxLength={200}
              placeholder="Ej: ACADEMIA CISCO - AULA"
              className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" name="activo" defaultChecked className="rounded" />
            <label className="text-sm text-gray-700">Área activa (puede recibir controles)</label>
          </div>

          {error && <div className="p-3 rounded-lg bg-red-50 text-xs text-red-600 font-medium">{error}</div>}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear Área"}
            </button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
