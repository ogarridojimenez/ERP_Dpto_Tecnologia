"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getGuardiaParte, saveEntrega, saveRecibo } from "@/app/actions/guardia";

export default function GuardiaAreaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const parteId = params.id as string;
  const areaId = params.areaId as string;

  const [parte, setParte] = useState<any>(null);
  const [registro, setRegistro] = useState<any>(null);
  const [perifericos, setPerifericos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"entrega" | "recibo">("entrega");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdminOrJefe, setIsAdminOrJefe] = useState(false);

  // Entrega form
  const [entNombre, setEntNombre] = useState("");
  const [entSolapin, setEntSolapin] = useState("");
  const [entDetalles, setEntDetalles] = useState<Record<string, number>>({});
  const [entObs, setEntObs] = useState("");

  // Recibo form
  const [recNombre, setRecNombre] = useState("");
  const [recSolapin, setRecSolapin] = useState("");
  const [recDetalles, setRecDetalles] = useState<Record<string, number>>({});
  const [recObs, setRecObs] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      // Get current user
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile && ["admin", "jefe"].includes(profile.role)) {
          setIsAdminOrJefe(true);
        }
      }

      const result = await getGuardiaParte(parteId);
      if (result.success && result.data) {
        setParte(result.data);
        const reg = (result.data as any).registros?.find((r: any) => r.area_id === areaId);
        setRegistro(reg);

        if (reg) {
          // Load existing data
          if (reg.fecha_hora_entrega) {
            setEntNombre(reg.entregado_por_nombre || "");
            setEntSolapin(reg.entregado_por_solapin || "");
            setEntObs(reg.observaciones || "");
            const detMap: Record<string, number> = {};
            reg.detalles?.forEach((d: any) => { detMap[d.periferico_id] = d.cantidad_entrega; });
            setEntDetalles(detMap);
          }
          if (reg.fecha_hora_recibo) {
            setRecNombre(reg.recibido_por_nombre || "");
            setRecSolapin(reg.recibido_por_solapin || "");
            setRecObs(reg.observaciones || "");
            const detMap: Record<string, number> = {};
            reg.detalles?.forEach((d: any) => { detMap[d.periferico_id] = d.cantidad_recibo; });
            setRecDetalles(detMap);
            setMode("recibo");
          } else if (reg.fecha_hora_entrega) {
            setMode("recibo");
          }
        }

        // Load perifericos for this area
        const { data: perfs } = await supabase
          .from("guardia_perifericos")
          .select("*")
          .eq("area_id", areaId)
          .is("deleted_at", null)
          .order("orden");
        if (perfs) setPerifericos(perfs);
      }
      setLoading(false);
    };
    fetchData();
  }, [parteId, areaId]);

  const canEditEntrega = !registro?.entregado_por_user_id || registro.entregado_por_user_id === currentUserId || isAdminOrJefe;
  const canEditRecibo = !registro?.recibido_por_user_id || registro.recibido_por_user_id === currentUserId || isAdminOrJefe;

  const handleSaveEntrega = async () => {
    if (!registro) return;
    setSaving(true);

    const formData = new FormData();
    formData.set("entregado_por_nombre", entNombre);
    formData.set("entregado_por_solapin", entSolapin);
    formData.set("observaciones", entObs);
    formData.set("detalles", JSON.stringify(
      perifericos.map((p) => ({
        periferico_id: p.id,
        cantidad: entDetalles[p.id] || 0,
        observaciones: null,
      }))
    ));

    const result = await saveEntrega(registro.id, formData);
    if (result.success) {
      const updated = await getGuardiaParte(parteId);
      if (updated.success) {
        setParte(updated.data);
        const reg = (updated.data as any)?.registros?.find((r: any) => r.area_id === areaId);
        setRegistro(reg);
        setMode("recibo");
      }
    } else {
      alert(result.error || "Error al guardar");
    }
    setSaving(false);
  };

  const handleSaveRecibo = async () => {
    if (!registro) return;
    setSaving(true);

    const formData = new FormData();
    formData.set("recibido_por_nombre", recNombre);
    formData.set("recibido_por_solapin", recSolapin);
    formData.set("observaciones", recObs);
    formData.set("detalles", JSON.stringify(
      perifericos.map((p) => ({
        periferico_id: p.id,
        cantidad: recDetalles[p.id] || 0,
        observaciones: null,
      }))
    ));

    const result = await saveRecibo(registro.id, formData);
    if (result.success) {
      router.push(`/guardia/${parteId}`);
    } else {
      alert(result.error || "Error al guardar");
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Cargando...</div>;
  }

  const area = registro?.area;
  const tieneEntrega = !!registro?.fecha_hora_entrega;
  const tieneRecibo = !!registro?.fecha_hora_recibo;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/guardia/${parteId}`} className="text-blue-600 hover:text-blue-800">
          ← Volver al parte
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h1 className="text-xl font-bold text-gray-800">
            {area?.tipo === "oficina" ? "🏢" : "🔬"} {area?.nombre || "Area desconocida"}
          </h1>
          <p className="text-sm text-gray-500">{area?.codigo}</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setMode("entrega")}
            className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${
              mode === "entrega"
                ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Entrega {tieneEntrega ? "✓" : ""}
          </button>
          <button
            onClick={() => setMode("recibo")}
            disabled={!tieneEntrega}
            className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${
              mode === "recibo"
                ? "border-b-2 border-green-600 text-green-600 bg-green-50"
                : tieneEntrega
                  ? "text-gray-500 hover:text-gray-700"
                  : "text-gray-300 cursor-not-allowed"
            }`}
          >
            Recibo {tieneRecibo ? "✓" : ""}
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Entrega */}
          {mode === "entrega" && (
            <div className="space-y-4">
              {!canEditEntrega && tieneEntrega && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  Solo el tecnico que realizo la entrega puede editarla.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nombre (Entrega)</label>
                  <input
                    type="text"
                    value={entNombre}
                    onChange={(e) => setEntNombre(e.target.value)}
                    disabled={!canEditEntrega && tieneEntrega}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Solapin (Entrega)</label>
                  <input
                    type="text"
                    value={entSolapin}
                    onChange={(e) => setEntSolapin(e.target.value)}
                    disabled={!canEditEntrega && tieneEntrega}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Numero de solapin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Perifericos - Cantidad Entregada</label>
                <div className="space-y-2">
                  {perifericos.map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="flex-1 text-sm text-gray-700">{p.nombre}</span>
                      <input
                        type="number"
                        min={0}
                        value={entDetalles[p.id] || ""}
                        onChange={(e) => setEntDetalles({ ...entDetalles, [p.id]: parseInt(e.target.value) || 0 })}
                        disabled={!canEditEntrega && tieneEntrega}
                        className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Observaciones</label>
                <textarea
                  value={entObs}
                  onChange={(e) => setEntObs(e.target.value)}
                  rows={2}
                  disabled={!canEditEntrega && tieneEntrega}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {canEditEntrega || !tieneEntrega ? (
                <button
                  data-testid="btn-guardar-entrega"
                  onClick={handleSaveEntrega}
                  disabled={saving || !entNombre || !entSolapin}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar Entrega"}
                </button>
              ) : null}
            </div>
          )}

          {/* Recibo */}
          {mode === "recibo" && (
            <div className="space-y-4">
              {!canEditRecibo && tieneRecibo && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  Solo el tecnico que realizo el recibo puede editarlo.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nombre (Recibe)</label>
                  <input
                    type="text"
                    value={recNombre}
                    onChange={(e) => setRecNombre(e.target.value)}
                    disabled={!canEditRecibo && tieneRecibo}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Solapin (Recibe)</label>
                  <input
                    type="text"
                    value={recSolapin}
                    onChange={(e) => setRecSolapin(e.target.value)}
                    disabled={!canEditRecibo && tieneRecibo}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Numero de solapin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Perifericos - Cantidad Recibida</label>
                <div className="space-y-2">
                  {perifericos.map((p) => {
                    const cantEnt = registro?.detalles?.find((d: any) => d.periferico_id === p.id)?.cantidad_entrega || 0;
                    const cantRec = recDetalles[p.id] || 0;
                    const diff = cantEnt - cantRec;
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="flex-1 text-sm text-gray-700">{p.nombre}</span>
                        <span className="text-xs text-gray-400 w-16 text-right">Ent: {cantEnt}</span>
                        <input
                          type="number"
                          min={0}
                          value={recDetalles[p.id] || ""}
                          onChange={(e) => setRecDetalles({ ...recDetalles, [p.id]: parseInt(e.target.value) || 0 })}
                          disabled={!canEditRecibo && tieneRecibo}
                          className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        {cantRec > 0 && diff !== 0 && (
                          <span className={`text-xs font-bold ${diff > 0 ? "text-red-600" : "text-orange-600"}`}>
                            {diff > 0 ? `Faltan ${diff}` : `Sobra ${Math.abs(diff)}`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Observaciones</label>
                <textarea
                  value={recObs}
                  onChange={(e) => setRecObs(e.target.value)}
                  rows={2}
                  disabled={!canEditRecibo && tieneRecibo}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {canEditRecibo || !tieneRecibo ? (
                <button
                  data-testid="btn-guardar-recibo"
                  onClick={handleSaveRecibo}
                  disabled={saving || !recNombre || !recSolapin}
                  className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-green-700 active:scale-95 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar Recibo"}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
