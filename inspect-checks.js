const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://postgres.bbznwxreyqswhgtdihxe:Adri%40n%40Ale%2A1234_@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  const checks = await client.query(`
    SELECT con.conname, pg_get_constraintdef(con.oid) AS def
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'activos' AND con.contype = 'c'
  `);
  checks.rows.forEach(r => console.log(`${r.conname}:\n  ${r.def}\n`));
  await client.end();
}
main().catch(e => console.error(e.message));
