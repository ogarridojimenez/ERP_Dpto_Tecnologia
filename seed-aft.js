const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://postgres.bbznwxreyqswhgtdihxe:Adri%40n%40Ale%2A1234_@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});

const ORG_ID = "00000000-0000-0000-0000-000000000001";
const ADMIN_ID = "3572899e-e236-4dcb-9f54-3e9d745bd4e4"; // Admin Sistema

async function main() {
  await client.connect();

  // 1. Obtener locales activos
  const locales = await client.query(`SELECT id, codigo, nombre FROM locales WHERE deleted_at IS NULL ORDER BY codigo LIMIT 5`);
  console.log(`Locales encontrados: ${locales.rows.length}`);
  locales.rows.forEach(l => console.log(`  ${l.codigo} -> ${l.id} (${l.nombre})`));

  if (locales.rows.length === 0) {
    console.log("ERROR: No hay locales. Crea locales primero desde el módulo Aulas.");
    return;
  }

  // 2. Tipos de activos (valores válidos del CHECK constraint)
  const tipos = ["computadora", "monitor", "teclado", "mouse", "proyector", "impresora", "tv", "otro"];

  // 3. Crear activos de prueba en cada locale
  console.log("\nCreando activos de prueba...");
  let count = 0;
  for (const locale of locales.rows) {
    // 5-8 activos por locale
    const numActivos = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numActivos; i++) {
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      const prefijoTipo = { computadora: "PC", monitor: "MN", teclado: "TC", mouse: "MS", proyector: "PY", impresora: "IM", tv: "TV", otro: "OT" }[tipo];
      const numero = `${locale.codigo}-${prefijoTipo}-${String(i + 1).padStart(3, "0")}`;
      const marca = ["Dell", "HP", "Lenovo", "Asus", "Logitech", "Cisco", "Epson", "BenQ"][Math.floor(Math.random() * 8)];
      const modelo = `${marca}-M${Math.floor(Math.random() * 9000) + 1000}`;
      const numSerie = `SN${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      const estado = ["nuevo", "nuevo", "bueno", "bueno", "bueno", "regular", "malo"][Math.floor(Math.random() * 7)];

      await client.query(`
        INSERT INTO activos (
          organization_id, locale_id, tipo, numero_medio_basico,
          marca, modelo, numero_serie, estado, fecha_adquisicion,
          tiene_qr, user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE - INTERVAL '1 year', true, $9)
        ON CONFLICT DO NOTHING
      `, [ORG_ID, locale.id, tipo, numero, marca, modelo, numSerie, estado, ADMIN_ID]);
      count++;
    }
    console.log(`  ${locale.codigo}: ${numActivos} activos`);
  }

  console.log(`\nTotal activos creados: ${count}`);

  // 4. Crear un control de prueba para el primer locale
  const primerLocale = locales.rows[0];
  const activosDelLocale = await client.query(`SELECT id FROM activos WHERE locale_id = $1 AND deleted_at IS NULL`, [primerLocale.id]);

  if (activosDelLocale.rows.length > 0) {
    const controlId = require("crypto").randomUUID();
    await client.query(`
      INSERT INTO controles_aft (
        id, organization_id, locale_id, fecha_planificada, estado, observaciones, user_id
      ) VALUES ($1, $2, $3, CURRENT_DATE, 'planificado', 'Control de prueba generado automaticamente', $4)
    `, [controlId, ORG_ID, primerLocale.id, ADMIN_ID]);

    console.log(`\nControl creado: ${controlId}`);
    console.log(`  Locale: ${primerLocale.codigo} (${primerLocale.nombre})`);
    console.log(`  Esperados: ${activosDelLocale.rows.length} activos`);
    console.log(`\nVer en: http://localhost:3000/aft/controles/${controlId}`);
  }

  // 5. Resumen
  console.log("\n=== RESUMEN FINAL ===");
  const totalActivos = await client.query("SELECT count(*) FROM activos WHERE deleted_at IS NULL");
  const totalControles = await client.query("SELECT count(*) FROM controles_aft WHERE deleted_at IS NULL");
  console.log(`Activos totales: ${totalActivos.rows[0].count}`);
  console.log(`Controles totales: ${totalControles.rows[0].count}`);

  await client.end();
}

main().catch(e => { console.error("ERROR:", e.message); process.exit(1); });
