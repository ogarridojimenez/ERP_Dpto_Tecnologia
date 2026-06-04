"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createGuardiaArea,
  updateGuardiaArea,
  deleteGuardiaArea,
  createGuardiaPeriferico,
  deleteGuardiaPeriferico,
  getGuardiaAreas,
} from "@/app/actions/guardia";

export default function GuardiaConfigPage() {
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewArea, setShowNewArea] = useState(false);
  const [newAreaCodigo, setNewAreaCodigo] = useState("");
  const [newAreaNombre, setNewAreaNombre] = useState("");
  const [newAreaTipo, setNewAreaTipo] = useState("laboratorio");
  const [editAreaId, setEditAreaId] = useState<string | null>(null);
  const [editCodigo, setEditCodigo] = useState("");
  const [editNombre, setEditNombre] = useState("");
  const [editTipo, setEditTipo] = useState("");
  const [showNewPeriferico, setShowNewPeriferico] = useState<string | null>(null);
  const [newPerifNombre, setNewPerifNombre] = useState("");
  const [newPerifOrden, setNewPerifOrden] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const result = await getGuardiaAreas();
    if (result.success) setAreas((result.data as any[]) || []);
    setLoading(false);
  };

  const handleCreateArea = async () => {
    if (!newAreaCodigo || !newAreaNombre) return;
    const formData = new FormData();
    formData.set("codigo", newAreaCodigo);
    formData.set("nombre", newAreaNombre);
    formData.set("tipo", newAreaTipo);
    const result = await createGuardiaArea(formData);
    if (result.success) {
      setShowNewArea(false);
      setNewAreaCodigo("");
      setNewAreaNombre("");
      setNewAreaTipo("laboratorio");
      loadData();
    } else {
      alert((result as any).error || "Error al crear area");
    }
  };

  const handleUpdateArea = async (id: string) => {
    const formData = new FormData();
    formData.set("codigo", editCodigo);
    formData.set("nombre", editNombre);
    formData.set("tipo", editTipo);
    const result = await updateGuardiaArea(id, formData);
    if (result.success) {
      setEditAreaId(null);
      loadData();
    } else {
      alert(result.error || "Error al actualizar");
    }
  };

  const handleDeleteArea = async (id: string, nombre: string) => {
    if (!confirm(`Eliminar el area "${nombre}"?`)) return;
    const result = await deleteGuardiaArea(id);
    if (result.success) {
      loadData();
    } else {
      alert(result.error || "Error al eliminar");
    }
  };

  const handleCreatePeriferico = async (areaId: string) => {
    if (!newPerifNombre) return;
    const formData = new FormData();
    formData.set("area_id", areaId);
    formData.set("nombre", newPerifNombre);
    formData.set("orden", String(newPerifOrden));
    const result = await createGuardiaPeriferico(formData);
    if (result.success) {
      setShowNewPeriferico(null);
      setNewPerifNombre("");
      setNewPerifOrden(0);
      loadData();
    } else {
      alert(result.error || "Error al crear periferico");
    }
  };

  const handleDeletePeriferico = async (id: string) => {
    const result = await deleteGuardiaPeriferico(id);
    if (result.success) {
      loadData();
    } else {
      alert(result.error || "Error al eliminar");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Cargando...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-800">Configuracion de Guardia</h1>
        <button
          onClick={() => setShowNewArea(true)}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95"
        >
          + Nueva Area
        </button>
      </div>

      {/* Nueva Area Form */}
      {showNewArea && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 space-y-4">
          <h3 className="font-bold text-blue-800">Nueva Area</h3>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Codigo (ej: LAB-201)"
              value={newAreaCodigo}
              onChange={(e) => setNewAreaCodigo(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Nombre"
              value={newAreaNombre}
              onChange={(e) => setNewAreaNombre(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={newAreaTipo}
              onChange={(e) => setNewAreaTipo(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="laboratorio">Laboratorio</option>
              <option value="oficina">Oficina</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateArea} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
              Crear
            </button>
            <button onClick={() => setShowNewArea(false)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Areas */}
      <div className="space-y-4">
        {areas.map((area) => (
          <div key={area.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
              {editAreaId === area.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editCodigo}
                    onChange={(e) => setEditCodigo(e.target.value)}
                    className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                  />
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                  />
                  <select
                    value={editTipo}
                    onChange={(e) => setEditTipo(e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                  >
                    <option value="laboratorio">Laboratorio</option>
                    <option value="oficina">Oficina</option>
                  </select>
                  <button onClick={() => handleUpdateArea(area.id)} className="rounded-lg bg-green-600 px-3 py-1 text-xs font-bold text-white hover:bg-green-700">
                    Guardar
                  </button>
                  <button onClick={() => setEditAreaId(null)} className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-50">
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{area.tipo === "oficina" ? "🏢" : "🔬"}</span>
                    <div>
                      <p className="font-bold text-gray-900">{area.nombre}</p>
                      <p className="text-xs text-gray-500">{area.codigo} • {area.tipo} • {area.perifericos?.length || 0} perifericos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditAreaId(area.id);
                        setEditCodigo(area.codigo);
                        setEditNombre(area.nombre);
                        setEditTipo(area.tipo);
                      }}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteArea(area.id, area.nombre)}
                      className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Perifericos */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-700">Perifericos</h4>
                <button
                  onClick={() => setShowNewPeriferico(area.id)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  + Agregar
                </button>
              </div>

              {showNewPeriferico === area.id && (
                <div className="flex items-center gap-2 mb-3 p-3 bg-blue-50 rounded-xl">
                  <input
                    type="text"
                    placeholder="Nombre del periferico"
                    value={newPerifNombre}
                    onChange={(e) => setNewPerifNombre(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Orden"
                    value={newPerifOrden}
                    onChange={(e) => setNewPerifOrden(parseInt(e.target.value) || 0)}
                    className="w-20 rounded-lg border border-gray-300 px-3 py-1 text-sm"
                  />
                  <button
                    onClick={() => handleCreatePeriferico(area.id)}
                    className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    Agregar
                  </button>
                  <button
                    onClick={() => setShowNewPeriferico(null)}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {area.perifericos && area.perifericos.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {area.perifericos.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm">
                      <span className="text-gray-700">{p.nombre}</span>
                      <button
                        onClick={() => handleDeletePeriferico(p.id)}
                        className="ml-1 text-red-400 hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No hay perifericos configurados</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
