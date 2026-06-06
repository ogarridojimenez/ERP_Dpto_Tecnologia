import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { ClipboardList, Shield, MonitorSpeaker, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";

const COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600",
  emerald: "bg-emerald-100 text-emerald-600",
  violet: "bg-violet-100 text-violet-600",
};

const COLOR_HOVER: Record<string, string> = {
  blue: "group-hover:text-blue-600",
  emerald: "group-hover:text-emerald-600",
  violet: "group-hover:text-violet-600",
};

const quickLinks: {
  href: string;
  label: string;
  sub: string;
  icon: typeof Shield;
  color: keyof typeof COLOR_CLASSES;
  roles: string[];
}[] = [
  { href: "/guardia", label: "Guardia", sub: "Partes diarios", icon: Shield, color: "blue", roles: ["admin", "jefe", "tecnico"] },
  { href: "/aulas", label: "Aulas", sub: "Control de tecnología", icon: MonitorSpeaker, color: "emerald", roles: ["admin", "jefe", "tecnico", "especialista_hardware"] },
  { href: "/aft", label: "Activos Fijos", sub: "Inventario", icon: ClipboardList, color: "violet", roles: ["admin", "jefe"] },
];

const ESTADO_LABEL: Record<string, string> = {
  planificado: "Planificado",
  en_curso: "En curso",
  completado: "Completado",
  cancelado: "Cancelado",
};

const ESTADO_COLOR: Record<string, string> = {
  planificado: "bg-slate-50 text-slate-700 border-slate-200",
  en_curso: "bg-blue-50 text-blue-700 border-blue-200",
  completado: "bg-green-50 text-green-700 border-green-200",
  cancelado: "bg-red-50 text-red-700 border-red-200",
};

export default async function DashboardPage() {
  const { role } = await requireAuth();
  const supabase = await createClient();

  const { count: aftActivos } = await supabase
    .from("controles_aft")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null)
    .in("estado", ["planificado", "en_curso"]);

  const { count: guardiaAbiertos } = await supabase
    .from("guardia_partes")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null)
    .neq("estado", "completado");

  const { count: aulasActivos } = await supabase
    .from("locales")
    .select("*", { count: "exact", head: true })
    .eq("estado", "activo");

  const { data: recientes } = await supabase
    .from("controles_aft")
    .select("id, fecha_planificada, estado, areas_aft(codigo, nombre)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    {
      label: "AFT activos",
      value: aftActivos ?? 0,
      sub: "Controles en curso o planificados",
      gradient: "from-violet-500 to-purple-700",
      shadow: "shadow-violet-500/20",
      icon: ClipboardList,
    },
    {
      label: "Guardia abiertos",
      value: guardiaAbiertos ?? 0,
      sub: "Partes sin completar",
      gradient: "from-blue-500 to-indigo-700",
      shadow: "shadow-blue-500/20",
      icon: Shield,
    },
    {
      label: "Aulas activas",
      value: aulasActivos ?? 0,
      sub: "Locales con control habilitado",
      gradient: "from-emerald-500 to-teal-700",
      shadow: "shadow-emerald-500/20",
      icon: MonitorSpeaker,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white shadow-lg md:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="relative">
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-blue-100 opacity-80 md:text-base">
            Panel de control del sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`rounded-2xl bg-gradient-to-br ${s.gradient} p-5 text-white shadow-lg ${s.shadow}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    {s.label}
                  </p>
                  <p className="mt-1 text-4xl font-black">{s.value}</p>
                  <p className="text-xs text-white/70">{s.sub}</p>
                </div>
                <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {recientes && recientes.length > 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
            <h2 className="text-base font-bold text-gray-900">Últimos Controles AFT</h2>
            <Link
              href="/aft"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Ver todos →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recientes.map((c: any) => {
              const area = Array.isArray(c.areas_aft) ? c.areas_aft[0] : c.areas_aft;
              const estadoClass = ESTADO_COLOR[c.estado] || "bg-gray-50 text-gray-700 border-gray-200";
              const estadoLabel = ESTADO_LABEL[c.estado] || c.estado;
              return (
                <Link
                  key={c.id}
                  href={`/aft/controles/${c.id}`}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {area ? `${area.codigo} - ${area.nombre}` : "Sin area"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {c.fecha_planificada || "Sin fecha"}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${estadoClass}`}>
                    {estadoLabel}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <ClipboardList className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-base font-bold text-gray-900">Sin actividad reciente</p>
          <p className="mt-1 text-sm text-gray-500">
            Aun no hay controles AFT registrados
          </p>
        </div>
      )}

      {(() => {
        const visible = quickLinks.filter((l) => l.roles.includes(role));
        if (visible.length === 0) return null;
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {visible.map((link) => {
              const Icon = link.icon;
              const colorBg = COLOR_CLASSES[link.color];
              const colorHover = COLOR_HOVER[link.color];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorBg}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{link.label}</p>
                      <p className="text-xs text-gray-500">{link.sub}</p>
                    </div>
                  </div>
                  <ArrowRight className={`h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1 ${colorHover}`} />
                </Link>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
