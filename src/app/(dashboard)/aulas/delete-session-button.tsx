"use client";

import { eliminarSession } from "@/app/actions/aulas";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("¿Eliminar esta sesión de revisión?")) return;
    const fd = new FormData();
    fd.set("session_id", sessionId);
    const res = await eliminarSession(fd);
    if (res.success) {
      router.refresh();
      toast.success("Sesión eliminada");
    } else {
      toast.error(res.error ?? "Error al eliminar");
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600"
      title="Eliminar sesión"
    >
      Eliminar
    </button>
  );
}
