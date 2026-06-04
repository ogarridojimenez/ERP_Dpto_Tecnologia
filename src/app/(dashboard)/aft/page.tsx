"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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

export default function AftPage() {
  const [userRole, setUserRole] = useState<ProfileRole | null>(null);
  const [controles, setControles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ areas: 0, mbs: 0, controlesActivos: 0, controlesTotales: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .is("deleted_at", null)
        .single();
      if (profile) setUserRole(profile.role as ProfileRole);

      // Cargar controles activos + últimos 5
      const { data: conts } = await supabase
        .from("controles_aft")
        .select("id, fecha_planificada, estado, areas_aft(codigo, nombre)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(20);

      if (conts) setControles(conts);

      // Stats
      const [{ count: areasCount }, { count: mbsCount }, { count: activosCount }, { count: totalesCount }] = await Promise.all([
        supabase.from("areas_aft").select("*", { count: "exact", head: true }).is("deleted_at", null),
        supabase.from("mb_area").select("*", { count: "exact", head: true }),
        supabase.from("controles_aft").select("*", { count: "exact", head: true }).in("estado", ["planificado", "en_curso"]),
        supabase.from("controles_aft").select("*", { count: "exact", head: true }).is("deleted_at", null),
      ]);

      setStats({
        areas: areasCount || 0,
        mbs: mbsCount || 0,
        controlesActivos: activosCount || 0,
        controlesTotales: totalesCount || 0,
      });

      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading || !userRole) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Cargando...</div>;
  }

  return (
    <RoleGuard userRole={userRole} allowedRoles={AFT_ALLOWED_ROLES}>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-white shadow-lg">
        <div className="relative z-10">
          <h1 className="text-3xl font-black tracking-tight">Activos Fijos Tangibles</h1>
          <p className="mt-2 text-blue-100 opacity-80">Control de inventario por Áreas de Responsabilidad</p>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/aft/areas" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-700 transition-all hover:bg-blue-50 active:scale-95">
              📋 Gestionar Áreas
            </Link>
            <Link href="/aft/controles/nuevo" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-inner transition-all hover:bg-blue-500 active:scale-95">
              ➕ Nuevo Control
            </Link>
            <Link href="/aft/historial" className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95">
              📚 Historial
            </Link>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard titulo="Áreas" valor={stats.areas} icono="📍" color="from-purple-500 to-purple-700" />
        <StatCard titulo="MBs Registrados" valor={stats.mbs} icono="🏷️" color="from-blue-500 to-blue-700" />
        <StatCard titulo="Controles Activos" valor={stats.controlesActivos} icono="🔄" color="from-orange-500 to-orange-700" />
        <StatCard titulo="Controles Totales" valor={stats.controlesTotales} icono="📊" color="from-green-500 to-green-700" />
      </div>

      {/* Controles Recientes */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">Controles Recientes</h2>
          <Link href="/aft/historial" className="text-xs font-bold text-blue-600 hover:text-blue-800">
            Ver todos →
          </Link>
        </div>

        {controles.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <div className="text-5xl mb-3">📦</div>
            <p className="font-bold">No hay controles aún</p>
            <p className="text-sm mt-1">Crea un área, sube el Excel de MBs y luego inicia un control.</p>
            <Link href="/aft/areas/nueva" className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
              Crear primera área
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {controles.slice(0, 8).map((c) => {
              const ec = ESTADO_COLORS[c.estado as keyof typeof ESTADO_COLORS] || ESTADO_COLORS.planificado;
              const area = (c as any).areas_aft;
              return (
                <Link key={c.id} href={`/aft/controles/${c.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {area?.codigo || "?"}
                      </span>
                      <span className="font-bold text-gray-900">{area?.nombre || "?"}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Planificado: {formatDate(c.fecha_planificada)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${ec.bg} ${ec.text} ${ec.border}`}>
                    {ec.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </RoleGuard>
  );
}

function StatCard({ titulo, valor, icono, color }: { titulo: string; valor: number; icono: string; color: string }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${color} p-4 text-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium opacity-80 uppercase tracking-wider">{titulo}</p>
          <p className="text-3xl font-black mt-1">{valor}</p>
        </div>
        <div className="text-4xl opacity-30">{icono}</div>
      </div>
    </div>
  );
}
