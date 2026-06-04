// Seed script: migra los 24 locales y su equipamiento desde Control_Aulas
// Ejecutar: npx tsx scripts/seed-aulas-from-control.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://bbznwxreyqswhgtdihxe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiem53eHJleXFzd2hndGRpaHhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDIwMDM1OSwiZXhwIjoyMDk1Nzc2MzU5fQ.QjFqL9ozTWrYek9FwRiGe1xGh2Mt9100R54AQQxrgX4",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const ORG_ID = "00000000-0000-0000-0000-000000000001";
const ADMIN_ID = "3572899e-e236-4dcb-9f54-3e9d745bd4e4";

// Mapeo de equipment de Control_Aulas a tipo_medio
const EQ_TO_TIPO: Record<string, string> = {
  PC: "Computadora",
  Periféricos: "Periféricos",
  TV: "Televisor",
  TW: "Televiewer",
  DS: "Datachow (Proyector)",
};

const DEFAULT_ROOMS = [
  { id: "A-101", type: "aula", equipment: ["PC", "Periféricos", "TV", "TW"] },
  { id: "A-102", type: "aula", equipment: ["PC", "Periféricos", "TV", "TW"] },
  { id: "A-103", type: "aula", equipment: ["PC", "Periféricos", "TV", "TW"] },
  { id: "A-104", type: "aula", equipment: ["PC", "Periféricos", "DS"] },
  { id: "A-105", type: "aula", equipment: ["PC", "Periféricos", "TV"] },
  { id: "A-106", type: "aula", equipment: [], condition: "NO PC, NO TV" },
  { id: "A-201", type: "aula", equipment: ["PC", "Periféricos", "TV", "TW"] },
  { id: "A-202", type: "aula", equipment: ["PC", "Periféricos", "TW"], condition: "NO TV" },
  { id: "A-203", type: "aula", equipment: ["PC", "Periféricos", "TV", "TW"] },
  { id: "A-204", type: "aula", equipment: ["PC", "Periféricos", "TV", "TW"] },
  { id: "A-205", type: "aula", equipment: ["PC", "Periféricos", "TV", "TW"] },
  { id: "A-206", type: "aula", equipment: ["PC", "Periféricos", "TV", "TW"] },
  { id: "A-207", type: "aula", equipment: ["TV", "TW"], condition: "NO PC" },
  { id: "A-301", type: "aula", equipment: [], condition: "Sin Condiciones" },
  { id: "A-302", type: "aula", equipment: ["PC", "Periféricos", "TV", "TW"] },
  { id: "A-303", type: "aula", equipment: ["PC", "Periféricos", "TV", "TW"] },
  { id: "A-304", type: "aula", equipment: ["PC", "Periféricos", "TV", "TW"] },
  { id: "A-305", type: "aula", equipment: [], condition: "Sin llave" },
  { id: "A-306", type: "aula", equipment: [], condition: "Sin llave" },
  { id: "A-307", type: "aula", equipment: ["PC", "Periféricos", "TV", "TW"] },
  { id: "CISCO 1", type: "aula", equipment: ["PC", "Periféricos", "TV"] },
  { id: "S-Lab-106", type: "aula", equipment: ["PC", "Periféricos", "DS"] },
  { id: "S-403", type: "salon", equipment: ["PC", "Periféricos", "TV"] },
  { id: "S-Villena", type: "salon", equipment: ["PC", "Periféricos", "DS"] },
];

async function main() {
  // Get tipo_medio IDs
  const { data: tipos } = await supabase.from("tipos_medio").select("id, nombre");
  const tipoMap: Record<string, string> = {};
  for (const t of tipos || []) tipoMap[t.nombre] = t.id;

  console.log("Tipo medio map:", tipoMap);

  for (const room of DEFAULT_ROOMS) {
    // Upsert locale
    const { data: existing } = await supabase
      .from("locales")
      .select("id")
      .eq("codigo", room.id)
      .maybeSingle();

    let localeId: string;
    if (existing) {
      localeId = existing.id;
      console.log(`Locale exists: ${room.id} (${localeId})`);
    } else {
      const { data: loc, error } = await supabase
        .from("locales")
        .insert({
          organization_id: ORG_ID,
          codigo: room.id,
          nombre: room.id,
          tipo: room.type,
          estado: room.condition ? "mantenimiento" : "activo",
          observaciones: room.condition || null,
          user_id: ADMIN_ID,
        })
        .select("id")
        .single();
      if (error) { console.error(`Error creating locale ${room.id}:`, error.message); continue; }
      localeId = loc.id;
      console.log(`Created locale: ${room.id} (${localeId})`);
    }

    // Create medios for each equipment type
    for (const eq of room.equipment) {
      const tipoNombre = EQ_TO_TIPO[eq];
      const tipoId = tipoMap[tipoNombre];
      if (!tipoId) {
        console.warn(`  No tipo_medio for: ${eq} → ${tipoNombre}, skipping`);
        continue;
      }

      const codigo = `${room.id}-${eq}`;
      const { data: existingMedio } = await supabase
        .from("medios")
        .select("id")
        .eq("codigo", codigo)
        .maybeSingle();

      if (existingMedio) {
        console.log(`  Medio exists: ${codigo}`);
      } else {
        const { error } = await supabase.from("medios").insert({
          organization_id: ORG_ID,
          locale_id: localeId,
          tipo_medio_id: tipoId,
          codigo,
          nombre: `${tipoNombre} ${room.id}`,
          estado: "bueno",
          user_id: ADMIN_ID,
        });
        if (error) console.error(`  Error creating medio ${codigo}:`, error.message);
        else console.log(`  Created medio: ${codigo}`);
      }
    }
  }

  console.log("Seed completo.");
}

main().catch(console.error);
