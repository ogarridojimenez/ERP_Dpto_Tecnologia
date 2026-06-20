"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { completeControl, cancelControl } from "@/app/actions/aft";

export function ControlActions({ controlId }: { controlId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleComplete() {
    if (!confirm("¿Marcar este control como completado?")) return;
    startTransition(async () => {
      const res = await completeControl(controlId);
      if (res.success) {
        toast.success("Control marcado como completado");
        router.refresh();
      } else {
        toast.error(res.error ?? "Error al completar");
      }
    });
  }

  function handleCancel() {
    if (!confirm("¿Cancelar este control? Esta acción no se puede deshacer.")) return;
    startTransition(async () => {
      const res = await cancelControl(controlId);
      if (res.success) {
        router.push("/aft");
      } else {
        toast.error(res.error ?? "Error al cancelar");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleComplete}
        disabled={pending}
        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
      >
        ✅ Marcar Completado
      </button>
      <button
        type="button"
        onClick={handleCancel}
        disabled={pending}
        className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        Cancelar
      </button>
    </div>
  );
}
