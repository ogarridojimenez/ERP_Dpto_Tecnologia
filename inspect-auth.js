const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://postgres.bbznwxreyqswhgtdihxe:Adri%40n%40Ale%2A1234_@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("=== AUTH USERS (primeros 10) ===");
  const r = await client.query(`
    SELECT id, email, created_at, email_confirmed_at, last_sign_in_at
    FROM auth.users
    ORDER BY created_at
    LIMIT 20
  `);
  r.rows.forEach(u => console.log(`${u.id} | ${u.email} | confirmado: ${u.email_confirmed_at ? "SI" : "NO"} | ultimo: ${u.last_sign_in_at || "nunca"}`));

  console.log("\n=== PROFILES SIN AUTH MATCH ===");
  const m = await client.query(`
    SELECT p.id, p.nombre_completo, p.role
    FROM profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE u.id IS NULL
  `);
  m.rows.forEach(p => console.log(`  ${p.nombre_completo} (${p.role}) -> ${p.id}`));

  await client.end();
}
main().catch(e => console.error(e.message));
