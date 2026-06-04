require('dotenv').config({ path: 'E:/Mis proyectos/ERP_Dpto_Tecnologia/.env' });
const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.bbznwxreyqswhgtdihxe',
  password: 'Adri@n@Ale*1234_',
  database: 'postgres',
  ssl: false
});

const sql = fs.readFileSync('E:/Mis proyectos/ERP_Dpto_Tecnologia/supabase/migrations/2026-06-03-aft-mobile-rls-anon.sql', 'utf8');

async function run() {
  await client.connect();
  console.log('Connected to Supabase');
  
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`\n[${i + 1}/${statements.length}] ${stmt.substring(0, 100)}...`);
    try {
      await client.query(stmt);
      console.log('  OK');
    } catch (e) {
      console.error(`  ERROR: ${e.message}`);
    }
  }
  
  // Verify
  console.log('\n=== Verifying policies ===');
  const res = await client.query(`
    SELECT tablename, policyname, roles, cmd, qual 
    FROM pg_policies 
    WHERE tablename IN ('controles_aft', 'areas_aft', 'activos_aft')
    ORDER BY tablename, policyname
  `);
  for (const row of res.rows) {
    console.log(`  ${row.tablename}: [${row.cmd}] ${row.policyname} -> roles: ${row.roles}`);
  }
  
  await client.end();
  console.log('\nDone.');
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
