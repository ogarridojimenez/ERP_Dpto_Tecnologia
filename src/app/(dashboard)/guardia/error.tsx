"use client";

export default function GuardiaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-xl font-bold text-red-700">Error en Guardia</h2>
      <p className="mt-2 text-sm text-gray-500">{error.message || "Error inesperado"}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
      >
        Reintentar
      </button>
    </div>
  );
}
