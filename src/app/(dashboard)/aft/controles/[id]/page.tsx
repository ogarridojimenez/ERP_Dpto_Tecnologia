import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/types/database";
import { RoleGuard } from "@/components/RoleGuard";
import { formatDate } from "@/lib/utils";
import { ControlActions } from "./control-actions";

export const dynamic = "force-dynamic";

const AFT_ALLOWED_ROLES: ProfileRole[] = ["admin", "jefe"];

type Activo = {
  id: string;
  mb: string;
  descripcion: string | null;
  escaneado: boolean;
  fecha_escaneo: string | null;
};

export default async function ControlDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 3 queries en paralelo: perfil, control (con area), activos del control.
  const [profileRes, controlRes, activosRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .is("deleted_at", null)
      .single(),
    supabase
      .from("controles_aft")
      .select(
        "id, area_id, fecha_planificada, fecha_realizada, estado, areas_aft(codigo, nombre)"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("activos_aft")
      .select("id, mb, descripcion, escaneado, fecha_escaneo")
      .eq("control_id", id)
      .order("mb"),
  ]);

  if (!controlRes.data) notFound();

  const userRole = (profileRes.data?.role ?? "tecnico") as ProfileRole;
  const detalles = (activosRes.data ?? []) as Activo[];
  const escaneados = detalles.filter((d) => d.escaneado);
  const pendientes = detalles.filter((d) => !d.escaneado);

  const areaInfo = (controlRes.data as { areas_aft?: { codigo?: string; nombre?: string } })
    .areas_aft;
  const control = {
    id: controlRes.data.id as string,
    area_codigo: areaInfo?.codigo ?? "?",
    area_nombre: areaInfo?.nombre ?? "?",
    fecha_planificada: controlRes.data.fecha_planificada as string,
    fecha_realizada: controlRes.data.fecha_realizada as string | null,
    estado: controlRes.data.estado as string,
  };

  const expected = detalles.length;
  const scanned = escaneados.length;
  const missing = pendientes.map((p) => ({ mb: p.mb, descripcion: p.descripcion }));
  const accuracy = expected > 0 ? Math.round((scanned / expected) * 100) : 0;

  const isCompleted = control.estado === "completado";
  const isCancelled = control.estado === "cancelado";
  const isAdminOrJefe = userRole === "admin" || userRole === "jefe";

  return (
    <RoleGuard userRole={userRole} allowedRoles={AFT_ALLOWED_ROLES}>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <Link href="/aft" className="text-xs text-blue-600 hover:text-blue-800">← Volver al Dashboard</Link>
          <div className="mt-1 flex flex-col gap-3">
            <div>
              <h1 className="text-2xl font-black text-gray-900 md:text-3xl">
                <span className="font-mono text-blue-700">{control.area_codigo}</span> - {control.area_nombre}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Planificado: {formatDate(control.fecha_planificada)} ·
                {control.fecha_realizada && ` Realizado: ${formatDate(control.fecha_realizada)} ·`}
                {" "}
                <span className={`font-bold ${isCompleted ? "text-green-600" : isCancelled ? "text-red-600" : "text-blue-600"}`}>
                  {control.estado.toUpperCase()}
                </span>
              </p>
            </div>
            {isAdminOrJefe && !isCompleted && !isCancelled && (
              <ControlActions controlId={id} />
            )}
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard titulo="Esperados" valor={expected} color="from-blue-500 to-blue-700" icono="📦" />
          <MetricCard titulo="Escaneados" valor={scanned} color="from-green-500 to-green-700" icono="✅" />
          <MetricCard titulo="Faltantes" valor={missing.length} color="from-red-500 to-red-700" icono="❌" />
          <MetricCard titulo="Precisión" valor={`${accuracy}%`} color="from-purple-500 to-purple-700" icono="🎯" />
        </div>

        {/* Barra de progreso */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-gray-700">Progreso del Control</h2>
            <span className="text-sm font-bold text-gray-900">{scanned} de {expected}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all"
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>

        {/* Faltantes */}
        {missing.length > 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50/30 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-red-800 mb-4">❌ Activos Faltantes ({missing.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {missing.map((m) => (
                <div key={m.mb} className="flex items-center gap-2 rounded-lg bg-white border border-red-200 p-2">
                  <span className="font-mono text-xs font-bold text-red-700">{m.mb}</span>
                  <span className="text-xs text-gray-600 truncate">{m.descripcion || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detalle completo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Escaneados */}
          <div className="rounded-2xl border border-green-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-green-200 bg-green-50 px-4 py-3">
              <h3 className="font-bold text-green-800">✅ Escaneados ({escaneados.length})</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {escaneados.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">Ningún MB escaneado aún</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {escaneados.map((e) => (
                    <li key={e.id} className="p-3 hover:bg-gray-50">
                      <div className="font-mono text-xs font-bold text-green-700">{e.mb}</div>
                      <div className="text-xs text-gray-600 truncate">{e.descripcion || "—"}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Pendientes */}
          <div className="rounded-2xl border border-orange-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-orange-200 bg-orange-50 px-4 py-3">
              <h3 className="font-bold text-orange-800">⏳ Pendientes ({pendientes.length})</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {pendientes.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">¡Todos los MBs escaneados!</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {pendientes.map((p) => (
                    <li key={p.id} className="p-3 hover:bg-gray-50">
                      <div className="font-mono text-xs font-bold text-orange-700">{p.mb}</div>
                      <div className="text-xs text-gray-600 truncate">{p.descripcion || "—"}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}

function MetricCard({ titulo, valor, color, icono }: { titulo: string; valor: number | string; color: string; icono: string }) {
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
