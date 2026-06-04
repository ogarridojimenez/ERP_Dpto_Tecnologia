"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { deleteControl } from "@/app/actions/aft";
import { ProfileRole } from "@/types/database";
import { RoleGuard } from "@/components/RoleGuard";
import { formatDate } from "@/lib/utils";

const AFT_ALLOWED_ROLES: ProfileRole[] = ["admin", "jefe"];

const ESTADO_COLORS = {
  planificado: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-300", label: "Planificado" },
  en_curso: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300", label: "En curso" },
  completado: { bg: "bg-green-50", text: "text-green-700", border: "border-green-300", label: "Completado" },
  cancelado: { bg: "bg-red-50", text: "text-red-700", border: "border-red-300", label: "Cancelado" },
};

export default function HistorialPage() {
  const [userRole, setUserRole] = useState<ProfileRole | null>(null);
  const [controles, setControles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [filterArea, setFilterArea] = useState<string>("todas");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).is("deleted_at", null).single();
      if (profile) setUserRole(profile.role as ProfileRole);

      const { data } = await supabase
        .from("controles_aft")
        .select("id, fecha_planificada, fecha_realizada, estado, created_at, areas_aft(codigo, nombre), activos_aft(count)")
        .is("deleted_at", null)
        .order("fecha_planificada", { ascending: false });

      if (data) setControles(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleDelete = async (id: string, codigo: string, estado: string) => {
    const msg = estado === "completado"
      ? `¿Eliminar el control completado del área "${codigo}"? Esto lo ocultará del historial.`
      : `¿Eliminar el control (${estado}) del área "${codigo}"? Esto lo ocultará del historial.`;
    if (!confirm(msg)) return;
    const res = await deleteControl(id);
    if (res.success) {
      setControles(controles.filter(c => c.id !== id));
    } else {
      alert(res.error);
    }
  };

  if (loading || !userRole) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Cargando historial...</div>;
  }

  const areas = Array.from(new Set(controles.map(c => (c as any).areas_aft?.codigo).filter(Boolean)));

  let filtered = controles;
  if (filterEstado !== "todos") {
    filtered = filtered.filter(c => c.estado === filterEstado);
  }
  if (filterArea !== "todas") {
    filtered = filtered.filter(c => (c as any).areas_aft?.codigo === filterArea);
  }
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(c => {
      const area = (c as any).areas_aft;
      return area?.codigo?.toLowerCase().includes(term) || area?.nombre?.toLowerCase().includes(term);
    });
  }

  return (
    <RoleGuard userRole={userRole} allowedRoles={AFT_ALLOWED_ROLES}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Historial de Controles</h1>
            <p className="text-sm text-gray-500">Todos los controles realizados y en curso</p>
          </div>
          <Link href="/aft" className="text-sm text-blue-600 hover:text-blue-800">← Volver</Link>
        </div>

        {/* Filtros */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="🔍 Buscar por código o nombre de área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="rounded-lg border border-gray-300 p-2 text-sm bg-white"
            >
              <option value="todos">Todos los estados</option>
              <option value="planificado">Planificado</option>
              <option value="en_curso">En curso</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="rounded-lg border border-gray-300 p-2 text-sm bg-white"
            >
              <option value="todas">Todas las áreas</option>
              {areas.map(c => <option key={c} value={c || ""}>{c}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-2">{filtered.length} de {controles.length} controles</p>
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-400">
            <div className="text-5xl mb-3">📚</div>
            <p className="font-bold">Sin controles en el historial</p>
            <Link href="/aft/controles/nuevo" className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
              Iniciar primer control
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Fecha Plan.</th>
                  <th className="px-4 py-3">Área</th>
                  <th className="px-4 py-3 text-center">MBs</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => {
                  const ec = ESTADO_COLORS[c.estado as keyof typeof ESTADO_COLORS] || ESTADO_COLORS.planificado;
                  const area = (c as any).areas_aft;
                  const mbCount = (c as any).activos_aft?.[0]?.count || 0;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">
                        <div className="font-bold">{formatDate(c.fecha_planificada)}</div>
                        {c.fecha_realizada && (
                          <div className="text-xs text-gray-400">Realizado: {formatDate(c.fecha_realizada)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-bold text-blue-700">{area?.codigo || "?"}</div>
                        <div className="text-xs text-gray-600">{area?.nombre || "?"}</div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{mbCount}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${ec.bg} ${ec.text} ${ec.border}`}>
                          {ec.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/aft/controles/${c.id}`} className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100">
                            Ver
                          </Link>
                          <button
                            onClick={() => handleDelete(c.id, area?.codigo || "?", c.estado)}
                            className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
