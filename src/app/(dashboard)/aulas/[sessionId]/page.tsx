"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, formatDate } from "@/lib/utils";
import { toggleBloqueoLocal, crearLocal, eliminarLocal } from "@/app/actions/aulas";

type LocaleRow = {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  estado: string;
  observaciones: string | null;
};

type VisitaRow = {
  id: string;
  locale_id: string;
  fecha_visita: string;
  revisor: string;
  estado_general: string | null;
  observaciones_generales: string | null;
};

type MedioRow = {
  id: string;
  codigo: string;
  nombre: string;
  locale_id: string;
};

const STATUS_COLORS = {
  bien: { bg: "bg-green-50", border: "border-green-400", text: "text-green-800", label: "✅ Bien" },
  regular: { bg: "bg-yellow-50", border: "border-yellow-400", text: "text-yellow-800", label: "⚠️ Regular" },
  mal: { bg: "bg-red-50", border: "border-red-400", text: "text-red-800", label: "❌ Mal" },
  pendiente: { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-500", label: "⏳ Pendiente" },
  bloqueado: { bg: "bg-slate-100", border: "border-slate-300", text: "text-slate-400", label: "🔒 Bloqueado" },
};

const EQ_ICONS: Record<string, string> = {
  PC: "🖥️",
  Periféricos: "🖱️",
  TV: "📺",
  TW: "📡",
  DS: "🔦",
};

export default function SessionPanelPage() {
  const params = useParams<{ sessionId: string }>();
  const [locales, setLocales] = useState<LocaleRow[]>([]);
  const [visitas, setVisitas] = useState<VisitaRow[]>([]);
  const [medios, setMedios] = useState<MedioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewLocal, setShowNewLocal] = useState(false);
  const [newLocalCodigo, setNewLocalCodigo] = useState("");
  const [newLocalNombre, setNewLocalNombre] = useState("");
  const [newLocalTipo, setNewLocalTipo] = useState("aula");
  const [newLocalObs, setNewLocalObs] = useState("");
  const [newLocalErr, setNewLocalErr] = useState("");

  const loadData = async () => {
    if (!params.sessionId) return;
    const supabase = createClient();

    const [resVisitas, resLocales, resMedios] = await Promise.all([
      supabase.from("visitas_aulas").select("id, locale_id, fecha_visita, revisor, estado_general, observaciones_generales").eq("session_id", params.sessionId).is("deleted_at", null),
      supabase.from("locales").select("id, codigo, nombre, tipo, estado, observaciones").is("deleted_at", null).order("codigo"),
      supabase.from("medios").select("id, codigo, nombre, locale_id").is("deleted_at", null),
    ]);

    if (resVisitas.error) { setError(resVisitas.error.message); setLoading(false); return; }
    if (resLocales.error) { setError(resLocales.error.message); setLoading(false); return; }
    if (!resVisitas.data || resVisitas.data.length === 0) { setError("Sesión no encontrada"); setLoading(false); return; }

    setVisitas(resVisitas.data);
    setLocales(resLocales.data);
    setMedios(resMedios.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [params.sessionId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Cargando...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/aulas" className="text-sm text-blue-600 hover:underline">&larr; Volver a revisiones</Link>
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  const visitaMap = new Map(visitas.map((v) => [v.locale_id, v]));
  const mediosPorLocal = new Map<string, MedioRow[]>();
  for (const m of medios) {
    if (!mediosPorLocal.has(m.locale_id)) mediosPorLocal.set(m.locale_id, []);
    mediosPorLocal.get(m.locale_id)!.push(m);
  }

  const { revisor, fecha_visita: fechaVisita } = visitas[0];
  const reviewable = locales.filter((l) => l.estado !== "inactivo");
  const blocked = locales.filter((l) => l.estado === "inactivo");
  const reviewed = reviewable.filter((l) => visitaMap.get(l.id)?.estado_general);
  const conProblemas = reviewable.filter((l) => {
    const v = visitaMap.get(l.id);
    return v?.estado_general === "mal" || v?.estado_general === "regular";
  });
  const pendientes = reviewable.filter((l) => !visitaMap.get(l.id)?.estado_general);

  return (
    <div className="space-y-4">
      {/* Header gradient */}
      <div className="rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 p-4 text-white shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-70">Facultad de Ciberseguridad · Depto. de Tecnología</p>
            <h1 className="mt-1 text-lg font-extrabold">Control de Tecnología en Aulas</h1>
          </div>
          <Link
            href={`/aulas/${params.sessionId}/reporte`}
            className="whitespace-nowrap rounded-lg border border-white/40 bg-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/30"
          >
            📊 Ver Reporte
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 rounded-lg bg-white/15 px-3.5 py-2.5">
          <div>
            <p className="text-[9px] uppercase tracking-wider opacity-70">Fecha de revisión</p>
            <p className="text-sm font-bold">{formatDate(fechaVisita)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider opacity-70">Revisor</p>
            <p className="text-sm font-bold">{revisor}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[9px] uppercase tracking-wider opacity-70">Progreso</p>
            <p className="text-sm font-bold">{reviewed.length} / {reviewable.length} locales</p>
          </div>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white/20">
          <div
            className="h-1.5 rounded-full bg-white transition-all duration-300"
            style={{ width: `${reviewable.length > 0 ? (reviewed.length / reviewable.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          ["Total locales", reviewable.length, "text-blue-600", "border-blue-400"],
          ["Revisados", reviewed.length, "text-green-600", "border-green-400"],
          ["Con problemas", conProblemas.length, "text-red-600", "border-red-400"],
          ["Pendientes", pendientes.length, "text-amber-600", "border-amber-400"],
        ].map(([label, value, color, border]) => (
          <div key={label as string} className={`rounded-lg border-t-[3px] bg-white p-3 text-center shadow-sm ${border}`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="mt-0.5 text-[11px] text-gray-500">{label as string}</p>
          </div>
        ))}
      </div>

      {/* Room grid by type */}
      {["aula", "salon", "laboratorio", "oficina", "almacen", "otro"].map((tipo) => {
        const rooms = locales.filter((l) => l.tipo === tipo);
        if (rooms.length === 0) return null;
        return (
          <div key={tipo}>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">
              {tipo.charAt(0).toUpperCase() + tipo.slice(1)}s ({rooms.length})
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {rooms.map((locale) => {
                const visita = visitaMap.get(locale.id);
                const isBlocked = locale.estado === "inactivo";
                const isPending = !visita?.estado_general;
                const hasProblems = visita?.estado_general === "mal" || visita?.estado_general === "regular";
                const allOk = visita?.estado_general === "bien";

                let st: keyof typeof STATUS_COLORS;
                if (isBlocked) st = "bloqueado";
                else if (isPending) st = "pendiente";
                else if (hasProblems) st = visita.estado_general === "mal" ? "mal" : "regular";
                else if (allOk) st = "bien";
                else st = "pendiente";
                const sc = STATUS_COLORS[st];
                const localeMedios = mediosPorLocal.get(locale.id) ?? [];

                return (
                  <div key={locale.id} className="relative group">
                    <Link
                      href={isBlocked ? "#" : `/aulas/${params.sessionId}/${visita?.id ?? "#"}`}
                      className={`block rounded-xl border-2 ${sc.border} ${sc.bg} p-3 text-center transition-all hover:scale-[1.03] hover:shadow-md ${isBlocked ? "pointer-events-none opacity-60" : ""}`}
                    >
                      <p className={`text-sm font-extrabold ${sc.text}`}>{locale.codigo}</p>
                      <p className={`text-[10px] ${sc.text} opacity-80`}>
                        {isBlocked ? "🔒 Bloqueado" : isPending ? "⏳ Pendiente" : sc.label}
                      </p>
                      {visita && !isBlocked && (
                        <p className="mt-0.5 text-[9px] text-gray-400">
                          {new Date(visita.fecha_visita).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                      {locale.observaciones && !isBlocked && (
                        <p className="mt-1 truncate text-[9px] text-gray-400">{locale.observaciones}</p>
                      )}
                      {!isBlocked && localeMedios.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                          {["PC", "Periféricos", "TV", "TW", "DS"].map((eq) => {
                            const hasEq = localeMedios.some((m) => m.nombre.includes(eq) || m.codigo.includes(eq));
                            return hasEq ? (
                              <span key={eq} className="text-[10px]" title={eq}>
                                {EQ_ICONS[eq] || eq}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </Link>
                    <button
                      onClick={async () => {
                        await toggleBloqueoLocal(locale.id);
                        loadData();
                      }}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white text-[10px] shadow-sm transition-colors hover:bg-gray-100"
                      title={isBlocked ? "Desbloquear" : "Bloquear"}
                    >
                      {isBlocked ? "🔓" : "🔒"}
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`¿Eliminar el local ${locale.codigo}?`)) return;
                        const fd = new FormData();
                        fd.set("locale_id", locale.id);
                        const res = await eliminarLocal(fd);
                        if (res.success) loadData();
                        else alert(res.error ?? "Error al eliminar");
                      }}
                      className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white text-[10px] shadow-sm opacity-0 transition-all hover:bg-red-50 group-hover:opacity-100"
                      title="Eliminar local"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Add local button */}
      <button
        onClick={() => setShowNewLocal((v) => !v)}
        className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
      >
        ➕ Añadir Local
      </button>

      {/* New local form */}
      {showNewLocal && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-800">Nuevo Local</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Código *</label>
              <input
                type="text"
                value={newLocalCodigo}
                onChange={(e) => setNewLocalCodigo(e.target.value.toUpperCase())}
                placeholder="Ej: A-401"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Nombre</label>
              <input
                type="text"
                value={newLocalNombre}
                onChange={(e) => setNewLocalNombre(e.target.value)}
                placeholder="Opcional"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Tipo *</label>
              <select
                value={newLocalTipo}
                onChange={(e) => setNewLocalTipo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                {["aula", "salon", "laboratorio", "oficina", "almacen", "otro"].map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Observaciones</label>
              <input
                type="text"
                value={newLocalObs}
                onChange={(e) => setNewLocalObs(e.target.value)}
                placeholder="Opcional"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            {newLocalErr && (
              <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{newLocalErr}</div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  setNewLocalErr("");
                  if (!newLocalCodigo.trim()) { setNewLocalErr("El código es obligatorio"); return; }
                  const fd = new FormData();
                  fd.set("codigo", newLocalCodigo);
                  fd.set("nombre", newLocalNombre || newLocalCodigo);
                  fd.set("tipo", newLocalTipo);
                  fd.set("observaciones", newLocalObs);
                  const res = await crearLocal(fd);
                  if (res.success) {
                    setShowNewLocal(false);
                    setNewLocalCodigo("");
                    setNewLocalNombre("");
                    setNewLocalTipo("aula");
                    setNewLocalObs("");
                    loadData();
                  } else {
                    setNewLocalErr(res.error ?? "Error al crear");
                  }
                }}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                ✅ Crear Local
              </button>
              <button
                type="button"
                onClick={() => setShowNewLocal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blocked section */}
      {blocked.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            Bloqueados ({blocked.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {blocked.map((l) => (
              <div key={l.id} className="flex items-center gap-1">
                <button
                  onClick={async () => {
                    await toggleBloqueoLocal(l.id);
                    loadData();
                  }}
                  className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-100"
                >
                  🔒 {l.codigo} — Desbloquear
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
