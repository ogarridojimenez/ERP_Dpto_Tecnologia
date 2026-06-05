import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { AlertTriangle, Clock, CheckCircle2, FileWarning, ArrowRight, Shield, MonitorSpeaker, ClipboardList } from "lucide-react";
import Link from "next/link";

const quickLinks: {
  href: string;
  label: string;
  sub: string;
  icon: typeof Shield;
  color: string;
  roles: string[];
}[] = [
  { href: "/guardia", label: "Guardia", sub: "Partes diarios", icon: Shield, color: "blue", roles: ["admin", "jefe", "tecnico"] },
  { href: "/aulas", label: "Aulas", sub: "Control de tecnología", icon: MonitorSpeaker, color: "emerald", roles: ["admin", "jefe", "tecnico", "especialista_hardware"] },
  { href: "/aft", label: "Activos Fijos", sub: "Inventario", icon: ClipboardList, color: "violet", roles: ["admin", "jefe"] },
];

export default async function DashboardPage() {
  const { role } = await requireAuth();
  const supabase = await createClient();

  const { data: incidencias } = await supabase
    .from("incidencias")
    .select(`id, tipo, urgente, resuelta, created_at, locale_id, locales!inner(nombre)`)
    .order("created_at", { ascending: false })
    .limit(10);

  const urgentes = incidencias?.filter((i) => i.urgente && !i.resuelta).length ?? 0;
  const pendientes = incidencias?.filter((i) => !i.resuelta).length ?? 0;
  const total = incidencias?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
          <p className="mt-1 text-blue-100 opacity-80">
            Panel de control del sistema
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-red-500 to-red-700 p-5 text-white shadow-lg shadow-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-red-100">
                Urgentes
              </p>
              <p className="mt-1 text-4xl font-black">{urgentes}</p>
              <p className="text-xs text-red-200">Pendientes de resolver</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-100">
                Abiertas
              </p>
              <p className="mt-1 text-4xl font-black">{pendientes}</p>
              <p className="text-xs text-amber-200">Incidencias sin resolver</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-5 text-white shadow-lg shadow-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-green-100">
                Total
              </p>
              <p className="mt-1 text-4xl font-black">{total}</p>
              <p className="text-xs text-green-200">Incidencias reportadas</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
              <FileWarning className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Incidencias Table */}
      {incidencias && incidencias.length > 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
            <h2 className="text-base font-bold text-gray-900">Últimas Incidencias</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {total} total
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {incidencias.slice(0, 5).map((inc) => (
              <div key={inc.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    inc.urgente && !inc.resuelta
                      ? "bg-red-100 text-red-600"
                      : inc.resuelta
                        ? "bg-green-100 text-green-600"
                        : "bg-amber-100 text-amber-600"
                  }`}>
                    {inc.urgente && !inc.resuelta ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : inc.resuelta ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{inc.tipo}</p>
                    <p className="text-xs text-gray-500">
                      {Array.isArray(inc.locales) && inc.locales.length > 0
                        ? (inc.locales[0] as Record<string, unknown>).nombre as string
                        : "Sin local"}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                  inc.resuelta
                    ? "bg-green-50 text-green-700 border-green-200"
                    : inc.urgente
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {inc.resuelta ? "Resuelta" : inc.urgente ? "Urgente" : "Pendiente"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <CheckCircle2 className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-base font-bold text-gray-900">Sin incidencias</p>
          <p className="mt-1 text-sm text-gray-500">
            No hay incidencias reportadas recientemente
          </p>
        </div>
      )}

      {/* Quick Links */}
      {(() => {
        const visible = quickLinks.filter((l) => l.roles.includes(role));
        if (visible.length === 0) return null;
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {visible.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${link.color}-100 text-${link.color}-600`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{link.label}</p>
                      <p className="text-xs text-gray-500">{link.sub}</p>
                    </div>
                  </div>
                  <ArrowRight className={`h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-${link.color}-600`} />
                </Link>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
