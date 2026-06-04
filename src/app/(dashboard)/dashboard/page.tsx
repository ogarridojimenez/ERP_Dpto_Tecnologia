import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
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
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">Urgentes pendientes</p>
          <p className="text-3xl font-bold text-red-700">{urgentes}</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-600">Incidencias abiertas</p>
          <p className="text-3xl font-bold text-yellow-700">{pendientes}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-600">Total reportadas</p>
          <p className="text-3xl font-bold text-green-700">{total}</p>
        </div>
      </div>

      {incidencias && incidencias.length > 0 && (
        <div className="rounded-lg border bg-white">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold text-gray-900">Últimas incidencias</h2>
          </div>
          <div className="divide-y">
            {incidencias.slice(0, 5).map((inc) => (
              <div key={inc.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {inc.tipo}
                    {inc.urgente && !inc.resuelta && (
                      <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                        Urgente
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Array.isArray(inc.locales) && inc.locales.length > 0 ? (inc.locales[0] as Record<string, unknown>).nombre as string : "Sin local"}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium ${
                    inc.resuelta ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {inc.resuelta ? "Resuelta" : "Pendiente"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
