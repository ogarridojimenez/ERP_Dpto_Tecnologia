"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteArea, updateArea } from "@/app/actions/aft";

export type AreaRow = {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  created_at: string;
  mb_count: number;
};

export function AreasClient({ initialAreas }: { initialAreas: AreaRow[] }) {
  const router = useRouter();
  const [areas, setAreas] = useState<AreaRow[]>(initialAreas);
  const [searchTerm, setSearchTerm] = useState("");
  const [editing, setEditing] = useState<{ id: string; codigo: string; nombre: string; activo: boolean } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const handleDelete = async (id: string, codigo: string, mbCount: number) => {
    if (mbCount > 0 && !confirm(`El área "${codigo}" tiene ${mbCount} MB(s) cargado(s). ¿Eliminar de todos modos?`)) return;
    if (mbCount === 0 && !confirm(`¿Eliminar el área "${codigo}"?`)) return;
    const res = await deleteArea(id);
    if (res.success) {
      setAreas((prev) => prev.filter((a) => a.id !== id));
      toast.success("Área eliminada");
      router.refresh();
    } else {
      toast.error(res.error ?? "Error al eliminar");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateArea(editing.id, formData);
    setSavingEdit(false);
    if (res.success) {
      setEditing(null);
      router.refresh();
      toast.success("Área actualizada");
    } else {
      toast.error(res.error ?? "Error al actualizar");
    }
  };

  const filtered = areas.filter(
    (a) =>
      a.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <input
            type="text"
            placeholder="🔍 Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-bold">{areas.length === 0 ? "No hay áreas creadas" : "Sin resultados"}</p>
            {areas.length === 0 && (
              <Link href="/aft/areas/nueva" className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                Crear primera área
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3 text-center">MBs</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{a.codigo}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{a.nombre}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${a.mb_count > 0 ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
                        {a.mb_count} MBs
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${a.activo ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                        {a.activo ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link href={`/aft/areas/${a.id}`} className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100">
                          Ver
                        </Link>
                        <button
                          onClick={() => setEditing({ id: a.id, codigo: a.codigo, nombre: a.nombre, activo: a.activo })}
                          className="rounded-lg bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 hover:bg-amber-100"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(a.id, a.codigo, a.mb_count)}
                          aria-label="Eliminar área"
                          className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-gray-900">Editar Área</h3>
            <p className="mt-1 text-xs text-gray-500">Modifica el código, nombre o estado del área.</p>
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Código</label>
                <input
                  name="codigo"
                  defaultValue={editing.codigo}
                  required
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nombre</label>
                <input
                  name="nombre"
                  defaultValue={editing.nombre}
                  required
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="activo"
                  defaultChecked={editing.activo}
                  className="rounded"
                />
                Área activa
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {savingEdit ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
