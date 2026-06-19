"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteGuardiaParte } from "@/app/actions/guardia";

export function DeleteParteButton({ parteId }: { parteId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Eliminar este parte de guardia? Esta accion no se puede deshacer.")) return;
    startTransition(async () => {
      const result = await deleteGuardiaParte(parteId);
      if (result.success) {
        toast.success("Parte eliminado");
        router.refresh();
      } else {
        toast.error(result.error || "Error al eliminar");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label="Eliminar parte"
      title="Eliminar"
      className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
