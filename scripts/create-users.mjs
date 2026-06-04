import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bbznwxreyqswhgtdihxe.supabase.co";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiem53eHJleXFzd2hndGRpaHhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODY3NTE4NywiZXhwIjoyMDY0MjUxMTg3fQ.-Cx7w5gV-L0VJLbmEGZ_GQv5P8Gs8e7wTBk52B-WEaQ";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const users = [
  { email: "admin@sitrade.uci.cu", password: "Admin2026!", role: "admin", name: "Admin Sistema" },
  { email: "jefe@sitrade.uci.cu", password: "Jefe2026!", role: "jefe", name: "Ricardo Jefe" },
  { email: "rrhh@sitrade.uci.cu", password: "Rrhh2026!", role: "rrhh", name: "Marta RRHH" },
  { email: "tecnico1@sitrade.uci.cu", password: "Tecnico2026!", role: "tecnico", name: "Javier Tecnico" },
  { email: "tecnico2@sitrade.uci.cu", password: "Tecnico2026!", role: "tecnico", name: "Pedro Tecnico" },
];

async function main() {
  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.name, role: u.role },
    });

    if (error) {
      console.log(`✗ ${u.email}: ${error.message}`);
      continue;
    }

    console.log(`✓ ${u.email} → ${data.user.id}`);

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: data.user.id, nombre_completo: u.name, role: u.role })
      .select();

    if (profileError) {
      console.log(`  ✗ profile: ${profileError.message}`);
    } else {
      console.log(`  ✓ profile creado (${u.role})`);
    }
  }
}

main().catch(console.error);
