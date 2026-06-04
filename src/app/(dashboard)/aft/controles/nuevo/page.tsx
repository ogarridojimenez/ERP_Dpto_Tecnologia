"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createControl } from "@/app/actions/aft";
import { ProfileRole } from "@/types/database";
import { RoleGuard } from "@/components/RoleGuard";

const AFT_ADMIN_ROLES: ProfileRole[] = ["admin", "jefe"];

function NuevaControlForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAreaId = searchParams.get("area_id") || "";
  
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<ProfileRole | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).is("deleted_at", null).single();
      if (profile) setUserRole(profile.role as ProfileRole);

      const { data } = await supabase
        .from("areas_aft")
        .select("id, codigo, nombre")
        .is("deleted_at", null)
        .eq("activo", true)
        .order("codigo");
      if (data) setAreas(data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    const res = await createControl(formData);
    
    if (res.success) {
      const data = res.data as { id: string };
      router.push(`/aft/controles/${data.id}`);
    } else {
      setError(res.error || "Error al crear el control");
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
          <h1 className="text-2xl font-black text-gray-900">Iniciar Control de Inventario</h1>
          <p className="text-sm text-gray-500">El sistema snapshot los MBs del área como esperados. Luego el técnico escanea en el área.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Área a Auditar *</label>
            <select
              name="area_id"
              required
              defaultValue={initialAreaId}
              className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Seleccione un área...</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              El área debe tener MBs cargados previamente (sube el Excel desde la página del área).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Fecha Planificada *</label>
            <input
              type="date"
              name="fecha_planificada"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Observaciones</label>
            <textarea
              name="observaciones"
              rows={3}
              className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: Control trimestral preventivo..."
            ></textarea>
          </div>

          {/* Hidden field - BUG FIX: schema requires estado */}
          <input type="hidden" name="estado" value="en_curso" />

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
              {loading ? "Creando..." : "Iniciar Control"}
            </button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}

export default function NuevaControlPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-gray-400">Cargando...</div>}>
      <NuevaControlForm />
    </Suspense>
  );
}
