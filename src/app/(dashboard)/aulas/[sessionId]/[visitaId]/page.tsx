"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { guardarRevisionLocal, obtenerSession } from "@/app/actions/aulas";
import { formatDate } from "@/lib/utils";

type EquipoItem = {
  medio_id: string;
  codigo: string;
  nombre: string;
  estado: string | null;
  observaciones: string;
};

type SessionResponse = {
  id: string;
  session_id: string;
  locale_id: string;
  fecha_visita: string;
  revisor: string;
  estado_general: string | null;
  observaciones_generales: string | null;
  locales: { codigo: string; nombre: string; tipo: string };
  detalles: Array<{
    id: string;
    medio_id: string;
    estado: string;
    observaciones: string | null;
    medios: { codigo: string; nombre: string };
  }>;
};

const EQ_ICONS: Record<string, string> = {
  PC: "🖥️",
  Periféricos: "🖱️",
  TV: "📺",
  TW: "📡",
  DS: "🔦",
};

function eqLabel(nombre: string): string {
  for (const [key, val] of Object.entries(EQ_ICONS)) {
    if (nombre.includes(key) || nombre.startsWith(key)) return `${val} ${nombre}`;
  }
  return nombre;
}

export default function RevisarLocalPage() {
  const router = useRouter();
  const params = useParams<{ sessionId: string; visitaId: string }>();

  const [equipos, setEquipos] = useState<EquipoItem[]>([]);
  const [estadoGeneral, setEstadoGeneral] = useState("bien");
  const [observaciones, setObservaciones] = useState("");
  const [visita, setVisita] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [addingEq, setAddingEq] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await obtenerSession(params.sessionId);
      if (cancelled) return;
      if (!res.success || !res.data) {
        setError(res.error ?? "Error al cargar datos");
        setLoading(false);
        return;
      }
      const v = (res.data as SessionResponse[]).find((v) => v.id === params.visitaId);
      if (!v) {
        setError("Visita no encontrada");
        setLoading(false);
        return;
      }
      setVisita(v);
      setEstadoGeneral(v.estado_general ?? "bien");
      setObservaciones(v.observaciones_generales ?? "");

      if (v.detalles && v.detalles.length > 0) {
        setEquipos(
          v.detalles.map((d) => ({
            medio_id: d.medio_id,
            codigo: d.medios.codigo,
            nombre: d.medios.nombre,
            estado: d.estado,
            observaciones: d.observaciones ?? "",
          }))
        );
      } else {
        const { createClient } = await import("@/lib/supabase/client");
        const client = createClient();
        const { data: medios } = await client
          .from("medios")
          .select("id, codigo, nombre")
          .eq("locale_id", v.locale_id)
          .is("deleted_at", null)
          .order("codigo");
        if (cancelled) return;
        setEquipos(
          (medios ?? []).map((m: { id: string; codigo: string; nombre: string }) => ({
            medio_id: m.id,
            codigo: m.codigo,
            nombre: m.nombre,
            estado: null,
            observaciones: "",
          }))
        );
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params.sessionId, params.visitaId]);

  function updateEquipo(idx: number, field: keyof EquipoItem, value: string | null) {
    setEquipos((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  }

  function removeEquipo(idx: number) {
    setEquipos((prev) => prev.filter((_, i) => i !== idx));
  }

  function addEquipo(eq: { medio_id: string; codigo: string; nombre: string }) {
    if (!equipos.find((e) => e.medio_id === eq.medio_id)) {
      setEquipos((prev) => [...prev, { ...eq, estado: null, observaciones: "" }]);
    }
    setAddingEq(false);
  }

  const doneCount = equipos.filter((e) => e.estado !== null).length;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const fd = new FormData();
    fd.set("visita_id", visita!.id);
    fd.set("estado_general", estadoGeneral);
    fd.set("observaciones_generales", observaciones);

    equipos.forEach((eq, idx) => {
      fd.set(`detalles[${idx}][medio_id]`, eq.medio_id);
      fd.set(`detalles[${idx}][estado]`, eq.estado ?? "bien");
      fd.set(`detalles[${idx}][observaciones]`, eq.observaciones);
    });

    const res = await guardarRevisionLocal(fd);
    if (res.success) {
      router.push(`/aulas/${params.sessionId}`);
    } else {
      setError(res.error ?? "Error al guardar");
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Cargando...</div>;
  }
  if (error && !visita) {
    return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  const locale = visita!.locales as { codigo: string; nombre: string; tipo: string };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {/* Back button */}
      <button
        onClick={() => router.push(`/aulas/${params.sessionId}`)}
        className="text-sm font-semibold text-blue-600 hover:underline"
      >
        ← Volver al panel
      </button>

      {/* Header gradient */}
      <div className="rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 p-4 text-white shadow-sm">
        <p className="text-[10px] uppercase tracking-widest opacity-70">{locale.tipo}</p>
        <p className="mt-1 text-2xl font-black">{locale.codigo}</p>
        <p className="mt-1 text-xs opacity-80">
          📅 {formatDate(visita!.fecha_visita)} &nbsp;·&nbsp; 👤 {visita!.revisor}
        </p>
        {locale.nombre && <p className="mt-0.5 text-xs opacity-60">{locale.nombre}</p>}
        <div className="mt-2.5 h-1 rounded-full bg-white/20">
          <div
            className="h-1 rounded-full bg-white transition-all duration-300"
            style={{ width: `${equipos.length > 0 ? (doneCount / equipos.length) * 100 : 0}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] opacity-70">{doneCount}/{equipos.length} equipos evaluados</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Equipment items */}
        {equipos.map((eq, idx) => (
          <div
            key={eq.medio_id}
            className={`relative rounded-xl border-l-4 bg-white p-4 shadow-sm transition-all ${
              eq.estado === "bien" ? "border-l-green-500" : eq.estado === "mal" ? "border-l-red-500" : "border-l-gray-200"
            }`}
          >
            <button
              type="button"
              onClick={() => removeEquipo(idx)}
              className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] text-red-600 transition-colors hover:bg-red-200"
              title="Eliminar equipo"
            >
              ✕
            </button>
            <p className="mb-2.5 text-sm font-bold text-gray-800">{eqLabel(eq.nombre)}</p>
            <div className="flex gap-2">
              {[
                ["bien", "✅ Bien", "border-green-500", "bg-green-50", "text-green-700"],
                ["regular", "⚠️ Regular", "border-yellow-500", "bg-yellow-50", "text-yellow-700"],
                ["mal", "❌ Mal", "border-red-500", "bg-red-50", "text-red-700"],
                ["ausente", "— Ausente", "border-gray-400", "bg-gray-100", "text-gray-600"],
              ].map(([val, lbl, border, bg, text]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => updateEquipo(idx, "estado", val)}
                  className={`flex-1 rounded-lg border-2 px-2 py-2 text-[11px] font-bold transition-all ${
                    eq.estado === val
                      ? `${border} ${bg} ${text}`
                      : "border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            {(eq.estado === "mal" || eq.estado === "regular") && (
              <input
                type="text"
                value={eq.observaciones}
                onChange={(e) => updateEquipo(idx, "observaciones", e.target.value)}
                placeholder="Describe el problema..."
                maxLength={1000}
                className="mt-2 w-full rounded-lg border border-red-200 px-3 py-2 text-xs outline-none transition-all focus:border-red-400"
              />
            )}
          </div>
        ))}

        {/* Add equipment button */}
        {!addingEq && (
          <button
            type="button"
            onClick={() => setAddingEq(true)}
            className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
          >
            ➕ Añadir equipo
          </button>
        )}

        {addingEq && (
          <div className="rounded-xl border bg-white p-3 shadow-sm">
            <p className="mb-2 text-xs font-bold text-gray-600">Seleccionar equipo para añadir:</p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(
                new Map(equipos.map((e) => [e.medio_id, e])),
                ([, e]) => e
              ).length === equipos.length && (
                <p className="w-full text-xs text-gray-400">
                  {equipos.length > 0 ? "Todos los equipos ya están agregados" : "Cargando equipos..."}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setAddingEq(false)}
              className="mt-2 text-xs text-gray-500 hover:underline"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Estado general */}
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-600">
            Estado general del local
          </label>
          <div className="flex gap-2">
            {[
              ["bien", "✅ Bien", "border-green-500", "bg-green-50", "text-green-700"],
              ["regular", "⚠️ Regular", "border-yellow-500", "bg-yellow-50", "text-yellow-700"],
              ["mal", "❌ Mal", "border-red-500", "bg-red-50", "text-red-700"],
            ].map(([val, lbl, border, bg, text]) => (
              <button
                key={val}
                type="button"
                onClick={() => setEstadoGeneral(val)}
                className={`flex-1 rounded-lg border-2 py-2 text-xs font-bold transition-all ${
                  estadoGeneral === val ? `${border} ${bg} ${text}` : "border-gray-200 text-gray-400 hover:bg-gray-50"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <label className="mt-3 mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-600">
            📝 Observaciones del local
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Observaciones adicionales (opcional)..."
            rows={3}
            maxLength={2000}
            className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none transition-all focus:border-blue-400"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "💾 Guardar progreso"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/aulas/${params.sessionId}`)}
            className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
