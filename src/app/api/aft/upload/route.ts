import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as xlsx from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const localeId = formData.get("locale_id") as string;

    if (!file || !localeId) {
      return NextResponse.json({ error: "Archivo y Local ID son requeridos" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = xlsx.read(arrayBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    if (rawData.length === 0) {
      return NextResponse.json({ error: "El archivo Excel está vacío" }, { status: 400 });
    }

    // Normalización de datos basada en el proyecto de referencia
    const processedAssets = rawData.map((row: any, index: number) => {
      // Intentar encontrar columnas por nombre común si no son exactos
      const findVal = (keys: string[]) => {
        const key = Object.keys(row).find(k => keys.some(name => k.toLowerCase().includes(name.toLowerCase())));
        return key ? row[key] : null;
      };

      return {
        locale_id: localeId,
        numero_medio_basico: findVal(["numero", "codigo", "medio"])?.toString().trim().toUpperCase(),
        tipo: findVal(["tipo"])?.toString().toLowerCase() || 'otro',
        marca: findVal(["marca"])?.toString(),
        modelo: findVal(["modelo"])?.toString(),
        numero_serie: findVal(["serie"])?.toString(),
        estado: findVal(["estado"])?.toString().toLowerCase() || 'bueno',
        fecha_adquisicion: findVal(["fecha"])?.toString(),
        observaciones: findVal(["observacion", "nota"])?.toString(),
        user_id: user.id,
      };
    }).filter(asset => asset.numero_medio_basico);

    // Upsert en lotes de 50 para evitar timeouts
    const { error: dbError } = await supabase
      .from("activos")
      .upsert(processedAssets, { onConflict: 'numero_medio_basico' });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      processed: processedAssets.length 
    });

  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Error interno al procesar el archivo" }, { status: 500 });
  }
}
