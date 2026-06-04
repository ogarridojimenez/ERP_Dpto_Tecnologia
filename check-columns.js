const { Client } = require('pg');
const c = new Client({ host: 'aws-1-us-east-2.pooler.supabase.com', port: 6543, user: 'postgres.bbznwxreyqswhgtdihxe', password: 'Adri@n@Ale*1234_', database: 'postgres', ssl: false });

async function run() {
  await c.connect();
  
  const r = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'controles_aft' ORDER BY ordinal_position");
  console.log('=== controles_aft columns ===');
  for (const row of r.rows) console.log('  ' + row.column_name + ' - ' + row.data_type);

  const r2 = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'activos_aft' ORDER BY ordinal_position");
  console.log('\n=== activos_aft columns ===');
  for (const row of r2.rows) console.log('  ' + row.column_name + ' - ' + row.data_type);

  const r3 = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'areas_aft' ORDER BY ordinal_position");
  console.log('\n=== areas_aft columns ===');
  for (const row of r3.rows) console.log('  ' + row.column_name + ' - ' + row.data_type);

  await c.end();
}

run();
