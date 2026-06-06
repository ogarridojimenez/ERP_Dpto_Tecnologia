"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getGuardiaParte, completarGuardiaParte } from "@/app/actions/guardia";
import { formatDate } from "@/lib/utils";

const ESTADO_COLORS = {
  borrador: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300", label: "Borrador" },
  completado: { bg: "bg-green-50", text: "text-green-700", border: "border-green-300", label: "Completado" },
};

export default function GuardiaPartePage() {
  const params = useParams();
  const router = useRouter();
  const parteId = params.id as string;
  const [parte, setParte] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completando, setCompletando] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const result = await getGuardiaParte(parteId);
      if (result.success) {
        setParte(result.data);
      }
      setLoading(false);
    };
    fetchData();
  }, [parteId]);

  const handleCompletar = async () => {
    setCompletando(true);
    const result = await completarGuardiaParte(parteId);
    if (result.success) {
      const updated = await getGuardiaParte(parteId);
      if (updated.success) setParte(updated.data);
    } else {
      alert(result.error || "Error al completar");
    }
    setCompletando(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Cargando...</div>;
  }

  if (!parte) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Parte no encontrado</p>
        <Link href="/guardia" className="text-blue-600 hover:underline mt-2 inline-block">Volver al historial</Link>
      </div>
    );
  }

  const ec = ESTADO_COLORS[parte.estado as keyof typeof ESTADO_COLORS] || ESTADO_COLORS.borrador;
  const allEntregado = parte.registros?.every((r: any) => r.fecha_hora_entrega) ?? false;
  const allRecibido = parte.registros?.every((r: any) => r.fecha_hora_recibo) ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white shadow-lg md:p-8">
        <div className="relative z-10">
          <div className="mb-2 flex flex-wrap items-center gap-2 md:gap-3">
            <Link href="/guardia" className="text-sm text-blue-200 hover:text-white transition-colors">
              ← Volver
            </Link>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${ec.bg} ${ec.text} ${ec.border}`}>
              {ec.label}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">Parte de Guardia</h1>
          <p className="mt-2 text-sm text-blue-100 opacity-80 md:text-base">{formatDate(parte.fecha)}</p>
          {parte.observaciones_generales && (
            <p className="mt-2 text-sm text-blue-200">{parte.observaciones_generales}</p>
          )}
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />
      </div>

      {/* Acciones */}
      <div className="flex gap-3">
        {allEntregado && !allRecibido && (
          <button
            onClick={handleCompletar}
            disabled={completando}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-green-700 active:scale-95 disabled:opacity-50"
          >
            {completando ? "Completando..." : "Marcar como Completado"}
          </button>
        )}
      </div>

      {/* Areas */}
      <div className="space-y-4">
        {parte.registros?.map((registro: any) => {
          const area = registro.area;
          const tieneEntrega = !!registro.fecha_hora_entrega;
          const tieneRecibo = !!registro.fecha_hora_recibo;
          const tieneDiscrepancias = registro.detalles?.some(
            (d: any) => d.cantidad_entrega !== d.cantidad_recibo && d.cantidad_recibo > 0
          );

          return (
            <div key={registro.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-2xl shrink-0">
                    {area?.tipo === "oficina" ? "🏢" : "🔬"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{area?.nombre || "Area desconocida"}</p>
                    <p className="text-xs text-gray-500">{area?.codigo}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  {tieneDiscrepancias && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold border bg-red-50 text-red-700 border-red-300">
                      Discrepancia
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    tieneRecibo ? "bg-green-50 text-green-700 border-green-300" :
                    tieneEntrega ? "bg-amber-50 text-amber-700 border-amber-300" :
                    "bg-gray-50 text-gray-500 border-gray-300"
                  }`}>
                    {tieneRecibo ? "Recibido" : tieneEntrega ? "Entregado" : "Pendiente"}
                  </span>
                </div>
              </div>

              <div className="p-4">
                {tieneEntrega && (
                  <div className="mb-3 text-sm">
                    <span className="font-bold text-gray-700">Entrega:</span>{" "}
                    <span className="text-gray-600">{registro.entregado_por_nombre} (Sol. {registro.entregado_por_solapin})</span>
                    <span className="text-gray-400 ml-2">{new Date(registro.fecha_hora_entrega).toLocaleString("es-DO")}</span>
                  </div>
                )}
                {tieneRecibo && (
                  <div className="mb-3 text-sm">
                    <span className="font-bold text-gray-700">Recibo:</span>{" "}
                    <span className="text-gray-600">{registro.recibido_por_nombre} (Sol. {registro.recibido_por_solapin})</span>
                    <span className="text-gray-400 ml-2">{new Date(registro.fecha_hora_recibo).toLocaleString("es-DO")}</span>
                  </div>
                )}

                {registro.detalles && registro.detalles.length > 0 && (
                  <div className="mt-3 -mx-4 overflow-x-auto">
                    <table className="w-full min-w-[400px] text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b border-gray-100">
                          <th className="pb-2 font-bold">Periferico</th>
                          <th className="pb-2 font-bold text-center">Entrega</th>
                          <th className="pb-2 font-bold text-center">Recibo</th>
                          <th className="pb-2 font-bold text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registro.detalles.map((d: any) => {
                          const diff = d.cantidad_entrega - d.cantidad_recibo;
                          return (
                            <tr key={d.id} className="border-b border-gray-50">
                              <td className="py-2 text-gray-800">{d.periferico?.nombre}</td>
                              <td className="py-2 text-center font-mono">{d.cantidad_entrega}</td>
                              <td className="py-2 text-center font-mono">{d.cantidad_recibo || "-"}</td>
                              <td className="py-2 text-center">
                                {d.cantidad_recibo > 0 ? (
                                  diff === 0 ? (
                                    <span className="text-green-600 font-bold text-xs">OK</span>
                                  ) : (
                                    <span className="text-red-600 font-bold text-xs">
                                      {diff > 0 ? `Faltan ${diff}` : `Sobra ${Math.abs(diff)}`}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <Link
                  href={`/guardia/${parteId}/${registro.area_id}`}
                  className="mt-3 inline-block rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-blue-700 active:scale-95"
                >
                  {tieneEntrega ? "Ver / Editar" : "Llenar Entrega"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
