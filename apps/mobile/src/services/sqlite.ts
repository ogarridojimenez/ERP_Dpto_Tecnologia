import * as SQLite from "expo-sqlite";

const DB_NAME = "aft_local.db";

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
    initSchema(db);
  }
  return db;
}

function initSchema(database: SQLite.SQLiteDatabase) {
  database.execSync(`
    CREATE TABLE IF NOT EXISTS local_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      control_id TEXT NOT NULL,
      mb TEXT NOT NULL,
      descripcion TEXT,
      synced_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pending_scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      control_id TEXT NOT NULL,
      mb TEXT NOT NULL,
      scanned_at TEXT DEFAULT (datetime('now')),
      sync_attempts INTEGER DEFAULT 0,
      last_error TEXT
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_local_assets_control ON local_assets(control_id);
    CREATE INDEX IF NOT EXISTS idx_local_assets_mb ON local_assets(control_id, mb);
    CREATE INDEX IF NOT EXISTS idx_pending_scans_control ON pending_scans(control_id);
    CREATE INDEX IF NOT EXISTS idx_pending_scans_mb ON pending_scans(control_id, mb);
  `);
}

// ─── LOCAL ASSETS ───────────────────────────────────────────────────────

export async function clearControlAssets(controlId: string) {
  const database = getDb();
  await database.runAsync("DELETE FROM local_assets WHERE control_id = ?", controlId);
}

export async function insertLocalAssets(
  controlId: string,
  assets: Array<{ mb: string; descripcion: string | null }>
) {
  const database = getDb();
  await clearControlAssets(controlId);

  for (const asset of assets) {
    await database.runAsync(
      `INSERT INTO local_assets (control_id, mb, descripcion) VALUES (?, ?, ?)`,
      controlId,
      asset.mb,
      asset.descripcion
    );
  }
}

export async function getLocalAssets(controlId: string) {
  const database = getDb();
  return await database.getAllAsync<{
    id: number;
    mb: string;
    descripcion: string | null;
  }>("SELECT id, mb, descripcion FROM local_assets WHERE control_id = ?", controlId);
}

export async function findLocalAssetByCode(controlId: string, code: string) {
  const database = getDb();
  return await database.getFirstAsync<{
    id: number;
    mb: string;
    descripcion: string | null;
  }>(
    "SELECT id, mb, descripcion FROM local_assets WHERE control_id = ? AND mb = ?",
    controlId,
    code
  );
}

export async function getAssetsCount(controlId: string) {
  const database = getDb();
  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM local_assets WHERE control_id = ?",
    controlId
  );
  return result?.count ?? 0;
}

// ─── PENDING SCANS ──────────────────────────────────────────────────────

export async function addPendingScan(controlId: string, mb: string) {
  const database = getDb();
  await database.runAsync(
    `INSERT INTO pending_scans (control_id, mb) VALUES (?, ?)`,
    controlId,
    mb
  );
}

export async function isAlreadyScanned(controlId: string, mb: string): Promise<boolean> {
  const database = getDb();
  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM pending_scans WHERE control_id = ? AND mb = ?",
    controlId,
    mb
  );
  return (result?.count ?? 0) > 0;
}

export async function deletePendingScan(scanId: number) {
  const database = getDb();
  await database.runAsync("DELETE FROM pending_scans WHERE id = ?", scanId);
}

export async function getPendingScanById(scanId: number) {
  const database = getDb();
  return await database.getFirstAsync<{ id: number; control_id: string; mb: string }>(
    "SELECT id, control_id, mb FROM pending_scans WHERE id = ?",
    scanId
  );
}

export async function getPendingScansForControl(controlId: string) {
  const database = getDb();
  return await database.getAllAsync<{
    id: number;
    control_id: string;
    mb: string;
    scanned_at: string;
  }>(
    "SELECT id, control_id, mb, scanned_at FROM pending_scans WHERE control_id = ?",
    controlId
  );
}

export async function getPendingScansCount(controlId: string) {
  const database = getDb();
  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM pending_scans WHERE control_id = ?",
    controlId
  );
  return result?.count ?? 0;
}

export async function clearPendingScansForControl(controlId: string) {
  const database = getDb();
  await database.runAsync("DELETE FROM pending_scans WHERE control_id = ?", controlId);
}

export async function markScanSyncError(scanId: number, error: string) {
  const database = getDb();
  await database.runAsync(
    "UPDATE pending_scans SET sync_attempts = sync_attempts + 1, last_error = ? WHERE id = ?",
    error,
    scanId
  );
}

// ─── APP META ───────────────────────────────────────────────────────────

export async function setMeta(key: string, value: string) {
  const database = getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)`,
    key,
    value
  );
}

export async function getMeta(key: string) {
  const database = getDb();
  const result = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = ?",
    key
  );
  return result?.value ?? null;
}
