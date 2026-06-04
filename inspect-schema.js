const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://postgres.bbznwxreyqswhgtdihxe:Adri%40n%40Ale%2A1234_@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});

async function inspect() {
  await client.connect();

  for (const tbl of ["activos", "controles_aft", "detalles_control", "activo_tipos", "locales", "movimientos_activos"]) {
    console.log(`\n=== ${tbl.toUpperCase()} ===`);
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tbl]);
    cols.rows.forEach(x => console.log(`  ${x.column_name}: ${x.data_type}${x.is_nullable === 'YES' ? '' : ' NOT NULL'}`));
  }

  console.log("\n=== COUNT activos_tipos ===");
  const t = await client.query("SELECT count(*) FROM activo_tipos");
  console.log("  tipos:", t.rows[0].count);

  console.log("\n=== COUNT locales activos ===");
  const l = await client.query("SELECT count(*) FROM locales WHERE activo = true");
  console.log("  locales activos:", l.rows[0].count);

  await client.end();
}

inspect().catch(e => { console.error(e.message); process.exit(1); });
