const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://postgres.bbznwxreyqswhgtdihxe:Adri%40n%40Ale%2A1234_@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});

async function inspect() {
  await client.connect();
  console.log("=== COLUMNAS DE PROFILES ===");
  const cols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
    ORDER BY ordinal_position
  `);
  cols.rows.forEach(x => console.log(`  ${x.column_name}: ${x.data_type}`));

  console.log("\n=== USUARIOS (10 primeros) ===");
  const users = await client.query(`
    SELECT * FROM profiles LIMIT 10
  `);
  users.rows.forEach(u => console.log(JSON.stringify(u, null, 2)));

  console.log("\n=== ACTIVOS (total por locale) ===");
  const activos = await client.query(`
    SELECT l.nombre AS locale, COUNT(a.id) AS total
    FROM locales l
    LEFT JOIN activos a ON a.locale_id = l.id
    GROUP BY l.nombre
    ORDER BY l.nombre
  `);
  activos.rows.forEach(r => console.log(`  ${r.locale.padEnd(30)} ${r.total} activos`));

  console.log("\n=== CONTROLES AFT ===");
  const controles = await client.query(`
    SELECT c.id, c.nombre, c.estado, c.fecha_programada, c.created_at,
           l.nombre AS locale,
           (SELECT COUNT(*) FROM detalles_control WHERE control_id = c.id) AS detalles
    FROM controles_aft c
    LEFT JOIN locales l ON l.id = c.locale_id
    ORDER BY c.created_at DESC
    LIMIT 10
  `);
  if (controles.rows.length === 0) console.log("  (ninguno)");
  controles.rows.forEach(r => console.log(`  [${r.estado?.padEnd(12)}] ${r.nombre.padEnd(30)} ${r.locale || "?"} | ${r.detalles} detalles`));

  await client.end();
}

inspect().catch(e => { console.error(e.message); process.exit(1); });
