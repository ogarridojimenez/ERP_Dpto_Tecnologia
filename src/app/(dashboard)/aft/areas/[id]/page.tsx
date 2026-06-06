"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { uploadAreaExcel, updateArea, deleteArea } from "@/app/actions/aft";
import { ProfileRole } from "@/types/database";
import { RoleGuard } from "@/components/RoleGuard";
import { formatDate } from "@/lib/utils";
import { QrsPdfButton } from "@/components/aft/QrsPdfButton";

const AFT_ADMIN_ROLES: ProfileRole[] = ["admin", "jefe"];

export default function AreaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [userRole, setUserRole] = useState<ProfileRole | null>(null);
  const [area, setArea] = useState<any>(null);
  const [mbs, setMbs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).is("deleted_at", null).single();
      if (profile) setUserRole(profile.role as ProfileRole);

      const { data: areaData, error: areaErr } = await supabase
        .from("areas_aft")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();

      if (areaErr) {
        console.error("Error cargando área:", areaErr);
      } else if (!areaData) {
        console.warn("Área no encontrada o eliminada:", id);
      }

      if (areaData) {
        setArea(areaData);
        const { data: mbData, error: mbErr } = await supabase
          .from("mb_area")
          .select("*")
          .eq("area_id", id)
          .order("mb");
        if (mbErr) console.error("Error cargando MBs:", mbErr);
        if (mbData) setMbs(mbData);
      }

      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgress("Subiendo y procesando Excel...");
    const formData = new FormData(e.currentTarget);
    
    const res = await uploadAreaExcel(id, formData);
    if (res.success) {
      const data = res.data as { count: number };
      setUploadProgress(`✅ ${data.count} MBs cargados correctamente`);
      // Recargar MBs
      const supabase = createClient();
      const { data: mbData } = await supabase.from("mb_area").select("*").eq("area_id", id).order("mb");
      if (mbData) setMbs(mbData);
    } else {
      setUploadProgress(`❌ ${res.error}`);
    }
    setUploading(false);
    setTimeout(() => setUploadProgress(""), 6000);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await updateArea(id, formData);
    if (res.success) {
      setEditing(false);
      // Refetch
      const supabase = createClient();
      const { data: areaData } = await supabase.from("areas_aft").select("*").eq("id", id).maybeSingle();
      if (areaData) setArea(areaData);
    } else {
      alert(res.error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar el área "${area.codigo} - ${area.nombre}"?`)) return;
    const res = await deleteArea(id);
    if (res.success) {
      router.push("/aft/areas");
    } else {
      alert(res.error);
    }
  };

  if (loading || !userRole) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Cargando...</div>;
  }

  if (!area) {
    return <div className="p-6 text-center text-gray-400">Área no encontrada</div>;
  }

  return (
    <RoleGuard userRole={userRole} allowedRoles={AFT_ADMIN_ROLES}>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div>
            <Link href="/aft/areas" className="text-xs text-blue-600 hover:text-blue-800">← Volver a Áreas</Link>
            <h1 className="mt-1 text-2xl font-black text-gray-900 md:text-3xl">
              <span className="font-mono text-blue-700">{area.codigo}</span> - {area.nombre}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {mbs.length} MBs registrados · Creada el {formatDate(area.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {mbs.length > 0 && (
              <QrsPdfButton
                areaCodigo={area.codigo}
                areaNombre={area.nombre}
                mbs={mbs.map((m) => ({ mb: m.mb, descripcion: m.descripcion }))}
              />
            )}
            <button
              onClick={() => setEditing(!editing)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              {editing ? "Cancelar" : "Editar"}
            </button>
            <button
              onClick={handleDelete}
              className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
            >
              Eliminar
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <form onSubmit={handleUpdate} className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 space-y-4">
            <h3 className="font-bold text-blue-800">Editar Área</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Código</label>
                <input name="codigo" defaultValue={area.codigo} required className="w-full rounded-lg border border-gray-300 p-2 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nombre</label>
                <input name="nombre" defaultValue={area.nombre} required className="w-full rounded-lg border border-gray-300 p-2 text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="activo" defaultChecked={area.activo} className="rounded" />
              <label className="text-sm text-gray-700">Área activa</label>
            </div>
            <button type="submit" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">
              Guardar Cambios
            </button>
          </form>
        )}

        {/* Upload Excel */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">📤 Cargar MBs desde Excel</h2>
              <p className="text-xs text-gray-500 mt-1">
                Sube el Listado de Activos Fijos del área. El sistema extrae los MBs (formato mb000012345) y la descripción.
                <br />
                <span className="text-orange-600 font-bold">⚠️ Al subir un nuevo Excel se reemplazan los MBs anteriores.</span>
              </p>
            </div>
          </div>
          <form onSubmit={handleUpload} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">Archivo Excel</label>
              <input
                type="file"
                name="file"
                accept=".xlsx,.xls"
                required
                disabled={uploading}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {uploading ? "Procesando..." : "Subir y Procesar"}
            </button>
          </form>
          {uploadProgress && <p className="mt-3 text-xs font-medium text-blue-600">{uploadProgress}</p>}
        </div>

        {/* Lista de MBs */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-800">MBs del Área ({mbs.length})</h2>
          </div>
          {mbs.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <div className="text-5xl mb-3">📋</div>
              <p className="font-bold">No hay MBs cargados</p>
              <p className="text-sm mt-1">Sube el Excel del área para empezar.</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-bold sticky top-0">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">MB</th>
                    <th className="px-4 py-3">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mbs.map((m, i) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-2 font-mono font-bold text-blue-700">{m.mb}</td>
                      <td className="px-4 py-2 text-gray-700">{m.descripcion || <span className="text-gray-400">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Botón de crear control */}
        {mbs.length > 0 && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-6 text-center">
            <h3 className="font-bold text-blue-900">¿Listo para iniciar un control?</h3>
            <p className="text-sm text-blue-700 mt-1">Una vez que imprimas los QRs y los pegues a los activos, inicia un control de inventario.</p>
            <Link
              href={`/aft/controles/nuevo?area_id=${id}`}
              className="mt-4 inline-block rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white hover:bg-blue-800"
            >
              ➕ Iniciar Control de esta Área
            </Link>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
