import { supabase } from "./supabase";
import { getPendingScansForControl, clearPendingScansForControl, markScanSyncError } from "./sqlite";

const BATCH_SIZE = 50;

const SYNC_URL =
  process.env.EXPO_PUBLIC_SYNC_URL ||
  "https://erp-dpto-technology.vercel.app/api/aft/sync";

export type SyncProgress = {
  current: number;
  total: number;
  status: "syncing" | "done" | "error";
  message?: string;
};

export async function syncControlScans(
  controlId: string,
  onProgress?: (p: SyncProgress) => void
): Promise<{ success: boolean; synced: number; errors: number }> {
  const pending = await getPendingScansForControl(controlId);
  if (pending.length === 0) {
    onProgress?.({ current: 0, total: 0, status: "done", message: "No hay escaneos pendientes" });
    return { success: true, synced: 0, errors: 0 };
  }

  let synced = 0;
  let errors = 0;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);

    onProgress?.({
      current: i,
      total: pending.length,
      status: "syncing",
      message: `Sincronizando ${i + 1}-${Math.min(i + BATCH_SIZE, pending.length)} de ${pending.length}...`,
    });

    const mbs = batch.map((s) => s.mb);

    try {
      const res = await fetch(SYNC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ control_id: controlId, mbs }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        for (const s of batch) await markScanSyncError(s.id, body.error || "Sync failed");
        errors += batch.length;
      } else {
        synced += batch.length;
      }
    } catch (e) {
      const errMsg = (e as Error).message;
      for (const s of batch) await markScanSyncError(s.id, errMsg);
      errors += batch.length;
    }
  }

  if (errors === 0) {
    await clearPendingScansForControl(controlId);
    onProgress?.({ current: pending.length, total: pending.length, status: "done", message: "Sincronizacion completa" });
    return { success: true, synced, errors: 0 };
  } else {
    onProgress?.({
      current: pending.length,
      total: pending.length,
      status: "error",
      message: `${errors} escaneos fallaron, se reintentaran despues`,
    });
    return { success: false, synced, errors };
  }
}

export async function downloadControlAssets(
  controlId: string
): Promise<number> {
  const { data: assets, error } = await supabase
    .from("activos_aft")
    .select("mb, descripcion")
    .eq("control_id", controlId);

  if (error) throw error;
  if (!assets) return 0;

  const { insertLocalAssets } = await import("./sqlite");
  await insertLocalAssets(controlId, assets);
  return assets.length;
}
