import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { DeleteParteButton } from "./delete-parte-button";

export const dynamic = "force-dynamic";

const ESTADO_COLORS = {
  borrador: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300", label: "Borrador" },
  completado: { bg: "bg-green-50", text: "text-green-700", border: "border-green-300", label: "Completado" },
};

type Parte = {
  id: string;
  fecha: string;
  estado: string;
  created_at: string;
};

export default async function GuardiaPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("guardia_partes")
    .select("id, fecha, estado, created_at")
    .is("deleted_at", null)
    .order("fecha", { ascending: false });

  const partes: Parte[] = data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white shadow-lg md:p-8">
        <div className="relative z-10">
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">Guardia - Partes Diarios</h1>
          <p className="mt-2 text-sm text-blue-100 opacity-80 md:text-base">Control de entrega y recibo de perifericos por area</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/guardia/nueva" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-700 transition-all hover:bg-blue-50 active:scale-95">
              Nuevo Parte
            </Link>
            <Link href="/guardia/config" className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95">
              Configuracion
            </Link>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />
      </div>

      {/* Lista de partes */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">Historial de Partes</h2>
        </div>

        {partes.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-bold">No hay partes de guardia</p>
            <p className="text-sm mt-1">Crea un parte para comenzar el control diario.</p>
            <Link href="/guardia/nueva" className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
              Crear primer parte
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {partes.map((p) => {
              const ec = ESTADO_COLORS[p.estado as keyof typeof ESTADO_COLORS] || ESTADO_COLORS.borrador;
              return (
                <div key={p.id} className="flex flex-col gap-3 p-4 hover:bg-gray-50 transition-colors sm:flex-row sm:items-center sm:justify-between">
                  <Link href={`/guardia/${p.id}`} className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl shrink-0">📋</div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900">{formatDate(p.fecha)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Creado: {new Date(p.created_at).toLocaleDateString("es-DO")}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${ec.bg} ${ec.text} ${ec.border}`}>
                      {ec.label}
                    </span>
                    <DeleteParteButton parteId={p.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
