const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const client = new Client({
  connectionString: "postgresql://postgres.bbznwxreyqswhgtdihxe:Adri%40n%40Ale%2A1234_@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("Conectado. Ejecutando migración AFT v2...");

  const sql = fs.readFileSync(
    path.join(__dirname, "supabase", "migrations", "2026-06-02-aft-v2-redesign.sql"),
    "utf8"
  );

  await client.query(sql);
  console.log("✅ Migración ejecutada correctamente");

  // Verificar
  const checks = [
    "SELECT count(*) FROM areas_aft",
    "SELECT count(*) FROM mb_area",
    "SELECT count(*) FROM activos_aft",
    "SELECT count(*) FROM controles_aft",
    "SELECT count(*) FROM activos",
  ];
  for (const q of checks) {
    const r = await client.query(q);
    console.log(`  ${q}: ${r.rows[0].count}`);
  }

  await client.end();
}

main().catch(e => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
