"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

type SessionData = {
  session_id: string;
  revisor: string;
  fecha_visita: string;
  total: number;
  revisados: number;
  con_problemas: number;
};

type VisitaFull = {
  id: string;
  session_id: string;
  locale_id: string;
  fecha_visita: string;
  revisor: string;
  estado_general: string | null;
  observaciones_generales: string | null;
  locales: { codigo: string; nombre: string; tipo: string };
};

const EQ_ICONS: Record<string, string> = {
  PC: "🖥️",
  Periféricos: "🖱️",
  TV: "📺",
  TW: "📡",
  DS: "🔦",
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export default function AulasHistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<Record<string, VisitaFull[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: visitas } = await supabase
        .from("visitas_aulas")
        .select("session_id, revisor, fecha_visita, estado_general, locale_id, deleted_at")
        .not("session_id", "is", null)
        .is("deleted_at", null)
        .order("fecha_visita", { ascending: false });

      const sesionesMap = new Map<string, SessionData>();
      for (const v of visitas ?? []) {
        if (!v.session_id) continue;
        const existing = sesionesMap.get(v.session_id);
        if (existing) {
          existing.total++;
          if (v.estado_general) {
            existing.revisados++;
            if (v.estado_general === "mal" || v.estado_general === "regular") existing.con_problemas++;
          }
        } else {
          sesionesMap.set(v.session_id, {
            session_id: v.session_id,
            revisor: v.revisor,
            fecha_visita: v.fecha_visita,
            total: 1,
            revisados: v.estado_general ? 1 : 0,
            con_problemas: v.estado_general === "mal" || v.estado_general === "regular" ? 1 : 0,
          });
        }
      }
      const arr = Array.from(sesionesMap.values()).sort(
        (a, b) => new Date(b.fecha_visita).getTime() - new Date(a.fecha_visita).getTime()
      );
      setSessions(arr);
      if (arr.length) setCurrentId(arr[0].session_id);
      setLoading(false);
    })();
  }, []);

  const loadExpanded = async (sessionId: string) => {
    if (expandedData[sessionId]) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("visitas_aulas")
      .select("id, session_id, locale_id, fecha_visita, revisor, estado_general, observaciones_generales, locales(codigo, nombre, tipo)")
      .eq("session_id", sessionId)
      .is("deleted_at", null)
      .order("locales(codigo)");
    if (data) setExpandedData((prev) => ({ ...prev, [sessionId]: data as unknown as VisitaFull[] }));
  };

  async function handleDelete(sessionId: string) {
    const supabase = createClient();
    await supabase.from("visitas_aulas").update({ deleted_at: new Date().toISOString() }).eq("session_id", sessionId);
    setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    if (currentId === sessionId) {
      const remaining = sessions.filter((s) => s.session_id !== sessionId);
      setCurrentId(remaining.length ? remaining[0].session_id : null);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400">Cargando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Revisión de Aulas</h1>
        <Link
          href="/aulas/nueva"
          className="self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:self-auto"
        >
          ➕ Nueva Revisión
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No hay revisiones registradas.</p>
          <Link href="/aulas/nueva" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
            Crear la primera revisión
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            {sessions.length} sesión{sessions.length !== 1 ? "es" : ""} registrada{sessions.length !== 1 ? "s" : ""}
          </p>
          {sessions.map((s) => {
            const isCurrent = s.session_id === currentId;
            const expanded = expandedId === s.session_id;
            const pendientes = s.total - s.revisados;

            return (
              <div
                key={s.session_id}
                className={`rounded-xl border bg-white p-4 shadow-sm ${isCurrent ? "border-blue-500" : "border-gray-200"}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-extrabold text-gray-900">{formatDate(s.fecha_visita)}</p>
                    <p className="mt-0.5 text-sm text-gray-500">👤 {s.revisor}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <span className="rounded-full bg-blue-100 px-3 py-0.5 text-[11px] font-bold text-blue-700">
                        ACTIVA
                      </span>
                    )}
                    {!isCurrent && (
                      <Link
                        href={`/aulas/${s.session_id}`}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        Activar
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar la revisión del ${formatDate(s.fecha_visita)} (${s.revisor})?`))
                          handleDelete(s.session_id);
                      }}
                      className="rounded p-1 text-sm text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Eliminar revisión"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">
                    {s.revisados}/{s.total} revisados
                  </span>
                  {s.con_problemas > 0 && (
                    <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-semibold text-red-700">
                      ⚠️ {s.con_problemas} con problemas
                    </span>
                  )}
                  {s.revisados === s.total && s.con_problemas === 0 && (
                    <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-700">
                      ✅ Completada sin problemas
                    </span>
                  )}
                  <button
                    onClick={async () => {
                      if (expanded) {
                        setExpandedId(null);
                      } else {
                        setExpandedId(s.session_id);
                        await loadExpanded(s.session_id);
                      }
                    }}
                    className="ml-auto text-xs font-semibold text-blue-600 hover:underline"
                  >
                    {expanded ? "▲ Ocultar detalles" : "▼ Ver detalles"}
                  </button>
                </div>

                {expanded && expandedData[s.session_id] && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    <div className="text-right">
                      <button
                        onClick={() => router.push(`/aulas/${s.session_id}/reporte`)}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        🖨️ Generar Reporte
                      </button>
                    </div>
                    {expandedData[s.session_id].map((v) => {
                      const locale = v.locales as { codigo: string; nombre: string; tipo: string } | null;
                      if (!locale) return null;
                      const hasProblem = v.estado_general === "mal" || v.estado_general === "regular";
                      const allOk = v.estado_general === "bien";
                      return (
                        <Link
                          key={v.id}
                          href={`/aulas/${s.session_id}/${v.id}`}
                          className={`block rounded-lg border p-3 transition-colors hover:shadow-sm ${
                            hasProblem
                              ? "border-orange-200 bg-orange-50"
                              : allOk
                                ? "border-green-200 bg-green-50"
                                : "border-gray-100 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {locale.codigo} <span className="font-normal text-gray-500">({locale.tipo})</span>
                              </p>
                            </div>
                            <p className="text-[10px] text-gray-400">
                              {v.fecha_visita ? fmtTime(v.fecha_visita) : ""}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-gray-600">
                            {!v.estado_general ? (
                              <span className="text-amber-600">⏳ Sin revisar</span>
                            ) : allOk ? (
                              <span className="text-green-600">✅ Todo OK</span>
                            ) : (
                              <span className="text-red-600">⚠️ {v.estado_general}</span>
                            )}
                          </p>
                          {v.observaciones_generales && (
                            <p className="mt-1 text-[11px] italic text-gray-500">📝 {v.observaciones_generales}</p>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
