"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type AreaOption = { id: string; codigo: string; nombre: string };

export function HistorialFilters({ areas }: { areas: AreaOption[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const estado = params.get("estado") ?? "todos";
  const areaId = params.get("area_id") ?? "todas";

  function update(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "todos" || value === "todas") {
      next.delete(name);
    } else {
      next.set(name, value);
    }
    // Resetear page al cambiar filtros para evitar paginas fuera de rango.
    next.delete("page");
    router.push(`?${next.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <select
        value={estado}
        onChange={(e) => update("estado", e.target.value)}
        className="rounded-lg border border-gray-300 p-2 text-sm bg-white"
      >
        <option value="todos">Todos los estados</option>
        <option value="planificado">Planificado</option>
        <option value="en_curso">En curso</option>
        <option value="completado">Completado</option>
        <option value="cancelado">Cancelado</option>
      </select>
      <select
        value={areaId}
        onChange={(e) => update("area_id", e.target.value)}
        className="rounded-lg border border-gray-300 p-2 text-sm bg-white"
      >
        <option value="todas">Todas las áreas</option>
        {areas.map((a) => (
          <option key={a.id} value={a.id}>{a.codigo} — {a.nombre}</option>
        ))}
      </select>
    </div>
  );
}
