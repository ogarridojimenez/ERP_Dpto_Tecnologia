"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteControl } from "@/app/actions/aft";

export function DeleteControlButton({
  id,
  codigo,
  estado,
}: {
  id: string;
  codigo: string;
  estado: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const msg =
      estado === "completado"
        ? `¿Eliminar el control completado del área "${codigo}"? Esto lo ocultará del historial.`
        : `¿Eliminar el control (${estado}) del área "${codigo}"? Esto lo ocultará del historial.`;
    if (!confirm(msg)) return;
    startTransition(async () => {
      const res = await deleteControl(id);
      if (res.success) {
        toast.success("Control eliminado");
        router.refresh();
      } else {
        toast.error(res.error ?? "Error al eliminar");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label="Eliminar control"
      className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
