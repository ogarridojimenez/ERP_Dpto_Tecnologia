import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyBearer, verifySyncToken } from "@/lib/auth/bearer";
import { logger } from "@/lib/logger";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    // Authn: aceptamos Bearer JWT del usuario movil o X-Sync-Token compartido.
    const session = await verifyBearer(req);
    const tokenOk = !session && verifySyncToken(req);
    if (!session && !tokenOk) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { control_id, mbs } = await req.json();

    if (!control_id || !Array.isArray(mbs) || mbs.length === 0) {
      return NextResponse.json({ error: "control_id and mbs[] required" }, { status: 400 });
    }

    const admin = createClient<Database>(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const normalized = mbs.map((m: string) => m.trim().toUpperCase());

    const { error, count } = await admin
      .from("activos_aft")
      .update({
        escaneado: true,
        fecha_escaneo: new Date().toISOString(),
      })
      .eq("control_id", control_id)
      .in("mb", normalized);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, synced: count || 0 });
  } catch (e) {
    logger.error("[api/aft/sync]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
