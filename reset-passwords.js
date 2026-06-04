const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  "https://bbznwxreyqswhgtdihxe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiem53eHJleXFzd2hndGRpaHhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDIwMDM1OSwiZXhwIjoyMDk1Nzc2MzU5fQ.QjFqL9ozTWrYek9FwRiGe1xGh2Mt9100R54AQQxrgX4",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const usuarios = [
    { email: "admin@sitrade.uci.cu", password: "Admin2026!" },
    { email: "jefe@sitrade.uci.cu", password: "Jefe2026!" },
    { email: "tecnico1@sitrade.uci.cu", password: "Tecnico2026!" },
    { email: "tecnico2@sitrade.uci.cu", password: "Tecnico2026!" },
    { email: "hardware@sitrade.uci.cu", password: "Hardware2026!" },
    { email: "rrhh@sitrade.uci.cu", password: "Rrhh2026!" },
  ];

  for (const u of usuarios) {
    const { data, error } = await sb.auth.admin.listUsers();
    if (error) {
      console.log(`Error listando: ${error.message}`);
      return;
    }
    const target = data.users.find(x => x.email === u.email);
    if (!target) {
      console.log(`NO ENCONTRADO: ${u.email}`);
      continue;
    }
    const { error: updErr } = await sb.auth.admin.updateUserById(target.id, { password: u.password });
    if (updErr) {
      console.log(`ERROR ${u.email}: ${updErr.message}`);
    } else {
      console.log(`OK ${u.email} -> ${u.password}`);
    }
  }
}

main().catch(e => console.error(e));
