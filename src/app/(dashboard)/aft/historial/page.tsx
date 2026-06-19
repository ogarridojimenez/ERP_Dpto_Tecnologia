import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/types/database";
import { RoleGuard } from "@/components/RoleGuard";
import { formatDate } from "@/lib/utils";
import { HistorialFilters } from "./historial-filters";
import { DeleteControlButton } from "./delete-control-button";

export const dynamic = "force-dynamic";

const AFT_ALLOWED_ROLES: ProfileRole[] = ["admin", "jefe"];
const PAGE_SIZE = 25;

const ESTADO_COLORS = {
  planificado: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-300", label: "Planificado" },
  en_curso: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300", label: "En curso" },
  completado: { bg: "bg-green-50", text: "text-green-700", border: "border-green-300", label: "Completado" },
  cancelado: { bg: "bg-red-50", text: "text-red-700", border: "border-red-300", label: "Cancelado" },
};

type SearchParams = {
  page?: string;
  estado?: string;
  area_id?: string;
};

function buildPageHref(base: URLSearchParams, page: number) {
  const next = new URLSearchParams(base.toString());
  if (page <= 1) next.delete("page");
  else next.set("page", String(page));
  const qs = next.toString();
  return qs ? `?${qs}` : "?";
}

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const estado = sp.estado ?? "todos";
  const areaId = sp.area_id ?? "todas";

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
      .select("id, codigo, nombre")
      .is("deleted_at", null)
      .order("codigo"),
  ]);

  const userRole = (profileRes.data?.role ?? "tecnico") as ProfileRole;
  const areasList = areasRes.data ?? [];

  let q = supabase
    .from("controles_aft")
    .select(
      "id, fecha_planificada, fecha_realizada, estado, created_at, areas_aft(codigo, nombre), activos_aft(count)",
      { count: "exact" }
    )
    .is("deleted_at", null);

  if (estado !== "todos") q = q.eq("estado", estado);
  if (areaId !== "todas") q = q.eq("area_id", areaId);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, count } = await q
    .order("fecha_planificada", { ascending: false })
    .range(from, to);

  const controles = data ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Construye URLSearchParams para los Links de paginacion conservando filtros.
  const baseParams = new URLSearchParams();
  if (estado !== "todos") baseParams.set("estado", estado);
  if (areaId !== "todas") baseParams.set("area_id", areaId);

  return (
    <RoleGuard userRole={userRole} allowedRoles={AFT_ALLOWED_ROLES}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Historial de Controles</h1>
            <p className="text-sm text-gray-500">Todos los controles realizados y en curso</p>
          </div>
          <Link href="/aft" className="self-start text-sm text-blue-600 hover:text-blue-800 sm:self-auto">← Volver</Link>
        </div>

        {/* Filtros */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <HistorialFilters areas={areasList} />
          <p className="text-xs text-gray-500 mt-2">
            {controles.length} visibles · {total} totales · página {page} de {totalPages}
          </p>
        </div>

        {/* Lista */}
        {controles.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-400">
            <div className="text-5xl mb-3">📚</div>
            <p className="font-bold">Sin controles en el historial</p>
            <Link href="/aft/controles/nuevo" className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
              Iniciar primer control
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
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
                  {controles.map((c) => {
                    const ec = ESTADO_COLORS[c.estado as keyof typeof ESTADO_COLORS] || ESTADO_COLORS.planificado;
                    const area = (c as { areas_aft?: { codigo?: string; nombre?: string } }).areas_aft;
                    const mbCount =
                      (c as { activos_aft?: { count: number }[] }).activos_aft?.[0]?.count ?? 0;
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
                          <div className="flex flex-wrap justify-end gap-2">
                            <Link
                              href={`/aft/controles/${c.id}`}
                              className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100"
                            >
                              Ver
                            </Link>
                            <DeleteControlButton
                              id={c.id}
                              codigo={area?.codigo || "?"}
                              estado={c.estado}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginacion */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                {page > 1 ? (
                  <Link
                    href={buildPageHref(baseParams, page - 1)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-bold text-gray-700"
                  >
                    ← Anterior
                  </Link>
                ) : (
                  <span className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-bold text-gray-400 opacity-40">
                    ← Anterior
                  </span>
                )}
                <span className="text-gray-600">
                  Página <strong>{page}</strong> de <strong>{totalPages}</strong>
                </span>
                {page < totalPages ? (
                  <Link
                    href={buildPageHref(baseParams, page + 1)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-bold text-gray-700"
                  >
                    Siguiente →
                  </Link>
                ) : (
                  <span className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-bold text-gray-400 opacity-40">
                    Siguiente →
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
