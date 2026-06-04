"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

type LocaleRow = {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  estado: string;
};

type VisitaRow = {
  id: string;
  locale_id: string;
  revisor: string;
  fecha_visita: string;
  estado_general: string | null;
  observaciones_generales: string | null;
  locales: { codigo: string; nombre: string; tipo: string };
};

type DetalleRow = {
  visita_id: string;
  medio_id: string;
  estado: string;
  observaciones: string | null;
  medios: { codigo: string; nombre: string };
};

const EQ_ICONS: Record<string, string> = {
  PC: "🖥️",
  Periféricos: "🖱️",
  TV: "📺",
  TW: "📡",
  DS: "🔦",
};

function eqIcon(nombre: string): string {
  for (const [key, val] of Object.entries(EQ_ICONS)) {
    if (nombre.includes(key) || nombre.startsWith(key)) return `${val} ${nombre}`;
  }
  return nombre;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function printSessionReport(
  visitas: VisitaRow[],
  detalles: DetalleRow[],
  revisor: string,
  fecha: string,
  totalLocales: number,
  revisados: number,
  conProblemas: number
) {
  const problemas = visitas.filter(
    (v) => v.estado_general === "mal" || v.estado_general === "regular"
  );
  const sinRev = visitas.filter((v) => !v.estado_general);
  const allOk = visitas.filter((v) => v.estado_general === "bien");

  const rows = visitas
    .map((v) => {
      const locale = v.locales as { codigo: string; nombre: string; tipo: string };
      const dets = detalles.filter((d) => d.visita_id === v.id);
      const cell = (nombre: string) => {
        const d = dets.find((dt) => dt.medios.nombre.includes(nombre) || dt.medios.codigo.includes(nombre));
        if (!d) return '<td style="text-align:center;color:#9ca3af">N/A</td>';
        if (d.estado === "bien") return '<td class="ok">✓ OK</td>';
        return `<td class="prob">✗ ${d.observaciones ? d.observaciones.substring(0, 40) : "Problema"}</td>`;
      };
      const obs = v.observaciones_generales
        ? `<div style="font-size:10px;color:#64748b;font-style:italic;margin-top:2px">📝 ${v.observaciones_generales}</div>`
        : "";
      const rc =
        v.estado_general === "mal" || v.estado_general === "regular"
          ? "has-prob"
          : v.estado_general === "bien"
            ? "is-ok"
            : "no-rev";
      return `<tr class="${rc}"><td><b>${locale.codigo}</b>${obs}</td><td>${locale.tipo}</td>${cell("PC")}${cell("Periféricos")}${cell("TV")}${cell("TW")}${cell("DS")}<td>${v.fecha_visita ? fmtTime(v.fecha_visita) : "—"}</td></tr>`;
    })
    .join("");

  const probHTML =
    problemas.length > 0
      ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px;margin-bottom:18px">
      <b style="color:#9a3412;font-size:13px">⚠️ Problemas detectados — ${problemas.length} local${problemas.length !== 1 ? "es" : ""}</b>
      <div style="margin-top:10px">${problemas
        .map((v) => {
          const locale = v.locales as { codigo: string; nombre: string; tipo: string };
          const dets = detalles.filter((d) => d.visita_id === v.id && d.estado !== "bien");
          return `<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #fed7aa">
          <b style="color:#c2410c">${locale.codigo}</b> <span style="color:#9a3412;font-size:11px">(${locale.tipo})</span>
          ${dets
            .map(
              (d) =>
                `<div style="font-size:11px;color:#7c2d12;margin:2px 0 0 12px">• ${eqIcon(d.medios.nombre)}: ${d.observaciones || "Sin descripción"}</div>`
            )
            .join("")}
          ${v.observaciones_generales ? `<div style="font-size:11px;color:#92400e;margin:3px 0 0 12px;font-style:italic">📝 ${v.observaciones_generales}</div>` : ""}
        </div>`;
        })
        .join("")}</div></div>`
      : "";

  const sinRevHTML =
    sinRev.length > 0
      ? `<div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px;margin-bottom:18px">
      <b style="color:#92400e;font-size:12px">🕐 Sin revisar (${sinRev.length}): ${sinRev.map((v) => (v.locales as { codigo: string }).codigo).join(", ")}</b>
    </div>`
      : "";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reporte — ${formatDate(fecha)}</title>
<style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;margin:24px;color:#1a202c}
.hdr{border-bottom:3px solid #1e3a8a;padding-bottom:12px;margin-bottom:16px}
.hdr h1{margin:0;font-size:18px;color:#1e3a8a}.hdr p{margin:3px 0 0;color:#64748b;font-size:11px}
.meta{display:flex;gap:20px;background:#dbeafe;border-radius:8px;padding:10px 14px;margin-bottom:14px}
.meta div{font-size:12px}.meta div small{display:block;font-size:10px;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:1px;font-weight:400}
.stats{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 14px;text-align:center}
.stat .n{font-size:20px;font-weight:700}.stat .l{font-size:10px;color:#64748b}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#1e3a8a;color:white;padding:7px 6px;text-align:left}td{padding:5px 6px;border-bottom:1px solid #e2e8f0;vertical-align:top}
tr.has-prob{background:#fff7ed}tr.is-ok{background:#f0fdf4}tr.no-rev{background:#fef9c3}
td.ok{text-align:center;color:#15803d;font-weight:700}td.prob{color:#b91c1c;font-weight:600;font-size:10px}
@media print{button{display:none!important}}</style>
</head><body>
<div class="hdr"><h1>Departamento de Tecnología — Facultad de Ciberseguridad</h1><p>Reporte de Revisión Tecnológica en Aulas</p></div>
<div class="meta">
  <div><small>Fecha de revisión</small><b>${formatDate(fecha)}</b></div>
  <div><small>Revisor / Especialista</small><b>${revisor}</b></div>
  <div><small>Reporte generado</small><b>${new Date().toLocaleDateString("es-ES")} ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</b></div>
</div>
<div class="stats">
  <div class="stat"><div class="n" style="color:#1e3a8a">${totalLocales}</div><div class="l">Total locales</div></div>
  <div class="stat"><div class="n" style="color:#059669">${revisados}</div><div class="l">Revisados</div></div>
  <div class="stat"><div class="n" style="color:#dc2626">${conProblemas}</div><div class="l">Con problemas</div></div>
  <div class="stat"><div class="n" style="color:#059669">${allOk.length}</div><div class="l">Todo OK</div></div>
  <div class="stat"><div class="n" style="color:#d97706">${sinRev.length}</div><div class="l">Sin revisar</div></div>
</div>
${probHTML}${sinRevHTML}
<b style="font-size:13px;color:#1e3a8a">Detalle completo por local</b>
<table style="margin-top:8px"><thead><tr><th>Local</th><th>Tipo</th><th>PC</th><th>Periféricos</th><th>TV</th><th>TW</th><th>DS</th><th>Hora</th></tr></thead>
<tbody>${rows}</tbody></table></body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

export default function ReportePage() {
  const params = useParams<{ sessionId: string }>();
  const [visitas, setVisitas] = useState<VisitaRow[]>([]);
  const [detalles, setDetalles] = useState<DetalleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.sessionId) return;
    (async () => {
      const supabase = createClient();
      const { data: v, error: vErr } = await supabase
        .from("visitas_aulas")
        .select("id, locale_id, revisor, fecha_visita, estado_general, observaciones_generales, locales(codigo, nombre, tipo)")
        .eq("session_id", params.sessionId)
        .is("deleted_at", null)
        .order("locales(codigo)");
      if (vErr) {
        setError(vErr.message);
        setLoading(false);
        return;
      }
      if (!v || v.length === 0) {
        setError("Sesión no encontrada");
        setLoading(false);
        return;
      }
      setVisitas(v as unknown as VisitaRow[]);

      const visitaIds = v.map((vi) => vi.id);
      const { data: d } = await supabase
        .from("detalles_visita")
        .select("visita_id, medio_id, estado, observaciones, medios(codigo, nombre)")
        .in("visita_id", visitaIds)
        .is("deleted_at", null);
      setDetalles((d ?? []) as unknown as DetalleRow[]);
      setLoading(false);
    })();
  }, [params.sessionId]);

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400">Cargando...</div>;
  if (error) {
    return (
      <div className="space-y-4">
        <Link href={`/aulas/${params.sessionId}`} className="text-sm text-blue-600 hover:underline">
          &larr; Volver al panel
        </Link>
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  const { revisor, fecha_visita } = visitas[0];
  const revisados = visitas.filter((v) => v.estado_general);
  const conProblemas = visitas.filter((v) => v.estado_general === "mal" || v.estado_general === "regular");
  const allOk = visitas.filter((v) => v.estado_general === "bien");
  const sinRev = visitas.filter((v) => !v.estado_general);
  const total = visitas.length;

  return (
    <div className="space-y-4">
      <Link href={`/aulas/${params.sessionId}`} className="text-sm font-semibold text-blue-600 hover:underline">
        &larr; Volver al panel
      </Link>

      {/* Session info */}
      <div className="rounded-xl bg-blue-50 p-4">
        <p className="text-base font-bold text-blue-900">{formatDate(fecha_visita)}</p>
        <p className="text-sm text-blue-700">👤 {revisor}</p>
      </div>

      {/* Stats */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-gray-800">📊 Resumen de la sesión</h3>
        <div className="grid grid-cols-5 gap-2">
          {[
            ["Total locales", total, "text-blue-600"],
            ["Revisados", revisados.length, "text-green-600"],
            ["Con problemas", conProblemas.length, "text-red-600"],
            ["Todo OK", allOk.length, "text-emerald-600"],
            ["Sin revisar", sinRev.length, "text-amber-600"],
          ].map(([label, value, color]) => (
            <div key={label as string} className="rounded-lg bg-gray-50 p-3 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="mt-0.5 text-[10px] text-gray-500">{label as string}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Problems section */}
      {conProblemas.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <h3 className="mb-2.5 text-sm font-bold text-orange-800">
            ⚠️ Problemas detectados ({conProblemas.length})
          </h3>
          {conProblemas.map((v) => {
            const locale = v.locales as { codigo: string; nombre: string; tipo: string };
            const dets = detalles.filter((d) => d.visita_id === v.id && d.estado !== "bien");
            return (
              <div key={v.id} className="mb-2 border-b border-orange-200 pb-2 last:border-0 last:pb-0">
                <p className="text-sm font-bold text-orange-700">
                  {locale.codigo}{" "}
                  <span className="font-normal text-orange-600">
                    ({locale.tipo}) · {fmtTime(v.fecha_visita)}
                  </span>
                </p>
                {dets.map((d) => (
                  <p key={d.medio_id} className="ml-3 mt-1 text-xs text-orange-800">
                    • {eqIcon(d.medios.nombre)}: {d.observaciones || "Sin descripción"}
                  </p>
                ))}
                {v.observaciones_generales && (
                  <p className="ml-3 mt-1 text-xs italic text-orange-700">
                    📝 {v.observaciones_generales}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Unreviewed section */}
      {sinRev.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <h3 className="mb-2 text-sm font-bold text-yellow-800">
            🕐 Locales sin revisar ({sinRev.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {sinRev.map((v) => {
              const locale = v.locales as { codigo: string };
              return (
                <span
                  key={v.id}
                  className="rounded-full border border-yellow-300 bg-yellow-100 px-3 py-0.5 text-xs font-bold text-yellow-800"
                >
                  {locale.codigo}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Print button */}
      <button
        onClick={() =>
          printSessionReport(visitas, detalles, revisor, fecha_visita, total, revisados.length, conProblemas.length)
        }
        className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
      >
        🖨️ Generar e Imprimir Reporte Completo
      </button>
    </div>
  );
}
