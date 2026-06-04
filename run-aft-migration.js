const { Client } = require("pg");
const fs = require("fs");

const url = "postgresql://postgres.bbznwxreyqswhgtdihxe:Adri%40n%40Ale%2A1234_@aws-1-us-east-2.pooler.supabase.com:6543/postgres";
const sql = fs.readFileSync("supabase/migrations/2026-06-01-aft-sync-rpc.sql", "utf-8");

(async () => {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    console.log("Connecting...");
    await client.connect();
    console.log("Executing migration...");
    await client.query(sql);
    console.log("✅ Migration executed successfully");
    
    // Verify
    const r = await client.query("SELECT proname FROM pg_proc WHERE proname = 'sync_inventory_scans'");
    console.log("Function exists:", r.rows.length > 0);
  } catch (e) {
    console.error("❌ Error:", e.message);
  } finally {
    await client.end();
  }
})();
