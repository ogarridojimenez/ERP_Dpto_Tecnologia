const XLSX = require("xlsx");
const path = "E:\\Mis proyectos\\ERP_Dpto_Tecnologia\\2107.xls";

try {
  const wb = XLSX.readFile(path, { type: "file" });
  console.log("=== HOJAS DEL EXCEL ===");
  wb.SheetNames.forEach((n, i) => console.log(`  Hoja ${i + 1}: ${n}`));

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    console.log(`\n=== HOJA: ${sheetName} (${rows.length} filas) ===`);
    const maxCols = Math.max(...rows.map(r => r.length));
    console.log(`Columnas detectadas: ${maxCols}`);
    const maxRows = Math.min(rows.length, 30);
    for (let i = 0; i < maxRows; i++) {
      const r = rows[i];
      console.log(`  Fila ${i + 1}: ${JSON.stringify(r)}`);
    }
    if (rows.length > 30) {
      console.log(`  ... (${rows.length - 30} filas más)`);
      const last = rows[rows.length - 1];
      console.log(`  Última fila: ${JSON.stringify(last)}`);
    }
  }
} catch (e) {
  console.error("ERROR:", e.message);
}
