"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { iniciarSession } from "@/app/actions/aulas";

export default function NuevaRevisionPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const res = await iniciarSession(fd);

    if (res.success && (res.data as { session_id?: string } | undefined)?.session_id) {
      const sessionId = (res.data as { session_id: string }).session_id;
      router.push(`/aulas/${sessionId}`);
    } else {
      setError(res.error ?? "Error al crear la revisión");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nueva revisión de aulas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Inicia una nueva ronda de revisión para todos los locales activos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <div>
          <label htmlFor="revisor" className="block text-sm font-medium text-gray-700">
            Nombre del revisor
          </label>
          <input
            id="revisor"
            name="revisor"
            type="text"
            required
            maxLength={200}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Ej: Adrián Alfonso"
          />
        </div>

        <div>
          <label htmlFor="fecha_visita" className="block text-sm font-medium text-gray-700">
            Fecha de la visita
          </label>
          <input
            id="fecha_visita"
            name="fecha_visita"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creando..." : "Iniciar revisión"}
        </button>
      </form>
    </div>
  );
}
