const { createClient } = require("@supabase/supabase-js");
const XLSX = require("xlsx");
const fs = require("fs");

const sb = createClient(
  "https://bbznwxreyqswhgtdihxe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiem53eHJleXFzd2hndGRpaHhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDIwMDM1OSwiZXhwIjoyMDk1Nzc2MzU5fQ.QjFqL9ozTWrYek9FwRiGe1xGh2Mt9100R54AQQxrgX4",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const ORG_ID = "00000000-0000-0000-0000-000000000001";
const ADMIN_ID = "3572899e-e236-4dcb-9f54-3e9d745bd4e4";

async function main() {
  // 1. Crear un área de prueba
  const { data: area, error: aErr } = await sb.from("areas_aft").insert({
    organization_id: ORG_ID,
    codigo: "2000070",
    nombre: "AULA 101/DOCENTE1 (TEST)",
    activo: true,
    user_id: ADMIN_ID,
  }).select().single();

  if (aErr) {
    console.error("Error creando área:", aErr.message);
    return;
  }
  console.log(`✅ Área creada: ${area.id} - ${area.codigo} - ${area.nombre}`);

  // 2. Generar un Excel de prueba con 8 MBs
  const testData = [
    ["Rotulo", "Codigo Interno", "Descripcion", "Estado"],
    ["mb000099001", "mb000099001", "Silla Uso General", "En Explotación"],
    ["mb000099002", "mb000099002", "Mesa de Trabajo", "En Explotación"],
    ["MB000099003", "MB000099003", "Computadora Dell", "En Explotación"],
    ["MB000099004", "MB000099004", "Monitor Samsung 24", "En Explotación"],
    ["mb000099005", "mb000099005", "Teclado Logitech", "En Explotación"],
    ["MB000099006", "MB000099006", "Raton Inalambrico", "En Explotación"],
    ["mb000099007", "mb000099007", "Proyector Epson", "En Explotación"],
    ["MB000099008", "MB000099008", "Pizarra Blanca", "En Explotación"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(testData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Activos");
  XLSX.writeFile(wb, "E:\\Mis proyectos\\ERP_Dpto_Tecnologia\\test-area.xlsx");
  console.log(`✅ Excel de prueba creado: test-area.xlsx`);

  // 3. Insertar MBs directamente (simula lo que hace uploadAreaExcel)
  const mbs = testData.slice(1).map(row => ({
    area_id: area.id,
    mb: row[0].toString().trim().toUpperCase().replace(/\s+/g, ""),
    descripcion: row[2],
    user_id: ADMIN_ID,
  }));

  const { error: mErr } = await sb.from("mb_area").insert(mbs);
  if (mErr) {
    console.error("Error insertando MBs:", mErr.message);
    return;
  }
  console.log(`✅ ${mbs.length} MBs insertados`);

  // 4. Verificar
  const { data: allMbs } = await sb.from("mb_area").select("*").eq("area_id", area.id);
  console.log(`\nMBs en BD para el área: ${allMbs?.length || 0}`);
  allMbs?.forEach(m => console.log(`  ${m.mb} - ${m.descripcion}`));

  console.log(`\n🎯 URL para probar:`);
  console.log(`  Área: http://localhost:3000/aft/areas/${area.id}`);
  console.log(`  QRs PDF: http://localhost:3000/api/aft/areas/${area.id}/qrs-pdf`);
}

main().catch(e => { console.error("ERROR:", e); process.exit(1); });
