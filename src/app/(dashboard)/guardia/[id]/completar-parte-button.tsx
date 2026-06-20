"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { completarGuardiaParte } from "@/app/actions/guardia";

export function CompletarParteButton({ parteId }: { parteId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await completarGuardiaParte(parteId);
      if (result.success) {
        toast.success("Parte completado");
        router.refresh();
      } else {
        toast.error(result.error || "Error al completar");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-green-700 active:scale-95 disabled:opacity-50"
    >
      {pending ? "Completando..." : "Marcar como Completado"}
    </button>
  );
}
