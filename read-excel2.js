const XLSX = require("xlsx");
const path = "E:\\Mis proyectos\\ERP_Dpto_Tecnologia\\2107.xls";

try {
  const wb = XLSX.readFile(path, { type: "file" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  console.log(`Total filas: ${rows.length}`);

  // Buscar todas las apariciones de "Area de Responsabilidad"
  console.log("\n=== AREAS DE RESPONSABILIDAD ENCONTRADAS ===");
  const areas = [];
  rows.forEach((row, i) => {
    const txt = row.join(" ").toLowerCase();
    if (txt.includes("area de responsabilidad") || txt.includes("área de responsabilidad")) {
      const original = row.find(c => typeof c === "string" && c.toLowerCase().includes("responsabilidad"));
      // Buscar el nombre del area
      const candidates = row.filter(c => typeof c === "string" && c.trim() && !c.toLowerCase().includes("responsabilidad") && !c.toLowerCase().includes("area"));
      const nombre = candidates.join(" ").trim();
      console.log(`  Fila ${i + 1}: ${JSON.stringify(row)}`);
      if (nombre) {
        areas.push({ fila: i + 1, texto: nombre, fila_completa: row });
      }
    }
  });

  console.log(`\nTotal áreas detectadas: ${areas.length}`);

  // Buscar también "Centro de Costo"
  console.log("\n=== CENTROS DE COSTO ===");
  rows.forEach((row, i) => {
    if (row.join(" ").toLowerCase().includes("centro de costo")) {
      console.log(`  Fila ${i + 1}: ${JSON.stringify(row)}`);
    }
  });

  // Mostrar áreas únicas (parsear codigo + nombre)
  console.log("\n=== AREAS PARSEADAS ===");
  const areasSet = new Map();
  rows.forEach((row) => {
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || "").trim();
      // Patrón: numero - nombre (ej: "2000016 - ACADEMIA CISCO - AULA")
      const m = cell.match(/^(\d{5,})\s*-\s*(.+)$/);
      if (m) {
        // Verificar que la fila contiene "Area de Responsabilidad" cerca
        const joined = row.join(" ");
        if (joined.toLowerCase().includes("area de responsabilidad") || joined.toLowerCase().includes("responsabilidad")) {
          const key = m[1];
          if (!areasSet.has(key)) {
            areasSet.set(key, { codigo: m[1], nombre: m[2].trim() });
            console.log(`  ${m[1]} - ${m[2].trim()}`);
          }
        }
      }
    }
  });

  // Distribución de MBs por área
  console.log("\n=== DISTRIBUCIÓN DE MBs ===");
  let currentArea = "DESCONOCIDA";
  let counts = {};
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const joined = row.join(" ");
    if (joined.toLowerCase().includes("area de responsabilidad") || joined.toLowerCase().includes("responsabilidad")) {
      for (const c of row) {
        const m = String(c).match(/^(\d{5,})\s*-\s*(.+)$/);
        if (m) {
          currentArea = `${m[1]} - ${m[2].trim()}`;
          break;
        }
      }
    }
    // Detectar MBs (empiezan con MB o mb, seguidos de números)
    const mb = row[0] || row[1];
    if (typeof mb === "string" && /^(mb|MB)\d/.test(mb.trim())) {
      counts[currentArea] = (counts[currentArea] || 0) + 1;
    }
  }
  for (const [area, count] of Object.entries(counts)) {
    console.log(`  ${area}: ${count} MBs`);
  }
} catch (e) {
  console.error("ERROR:", e.message);
}
