"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import {
  guardiaAreaSchema,
  guardiaPerifericoSchema,
  guardiaParteSchema,
  guardiaEntregaSchema,
  guardiaReciboSchema,
} from "@/lib/schemas/aft";
import type {
  GuardiaArea,
  GuardiaPeriferico,
  GuardiaParte,
  GuardiaRegistro,
  GuardiaDetalle,
  GuardiaParteConRegistros,
  GuardiaAreaConPerifericos,
} from "@/types/database";

type ActionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return { supabase, user };
}

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ============================================================================
// AREAS
// ============================================================================

export async function getGuardiaAreas(): Promise<ActionResult> {
  try {
    const admin = getAdminClient();
    const { data: areas, error: areasError } = await admin
      .from("guardia_areas")
      .select("*")
      .is("deleted_at", null)
      .order("codigo");

    if (areasError) throw new Error(areasError.message);

    const { data: perifericos } = await admin
      .from("guardia_perifericos")
      .select("*")
      .is("deleted_at", null)
      .order("orden");

    const result: GuardiaAreaConPerifericos[] = (areas || []).map((a) => ({
      ...a,
      perifericos: (perifericos || []).filter((p) => p.area_id === a.id),
    }));

    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export async function createGuardiaArea(formData: FormData) {
  try {
    const { user } = await requireAuth();
    const admin = getAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    if (!profile?.organization_id) {
      return { success: false, error: "Sin organizacion asignada" } as ActionResult;
    }

    const validated = guardiaAreaSchema.parse({
      codigo: formData.get("codigo") as string,
      nombre: formData.get("nombre") as string,
      tipo: formData.get("tipo") as string,
    });

    const { data, error } = await admin
      .from("guardia_areas")
      .insert({
        organization_id: profile.organization_id,
        codigo: validated.codigo,
        nombre: validated.nombre,
        tipo: validated.tipo,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    revalidatePath("/guardia/config");
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export async function updateGuardiaArea(id: string, formData: FormData) {
  try {
    const { user } = await requireAuth();
    const admin = getAdminClient();

    const validated = guardiaAreaSchema.parse({
      codigo: formData.get("codigo") as string,
      nombre: formData.get("nombre") as string,
      tipo: formData.get("tipo") as string,
    });

    const { data, error } = await admin
      .from("guardia_areas")
      .update({ codigo: validated.codigo, nombre: validated.nombre, tipo: validated.tipo })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    revalidatePath("/guardia/config");
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export async function deleteGuardiaArea(id: string) {
  try {
    const { user } = await requireAuth();
    const admin = getAdminClient();

    const { count } = await admin
      .from("guardia_registros")
      .select("id", { count: "exact", head: true })
      .eq("area_id", id);

    if (count && count > 0) {
      return { success: false, error: "No se puede eliminar un area con registros de guardia" };
    }

    const { error } = await admin
      .from("guardia_areas")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/guardia/config");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

// ============================================================================
// PERIFERICOS
// ============================================================================

export async function createGuardiaPeriferico(formData: FormData) {
  try {
    const { user } = await requireAuth();
    const admin = getAdminClient();

    const validated = guardiaPerifericoSchema.parse({
      area_id: formData.get("area_id") as string,
      nombre: formData.get("nombre") as string,
      orden: parseInt(formData.get("orden") as string || "0"),
    });

    const { data, error } = await admin
      .from("guardia_perifericos")
      .insert({ ...validated, user_id: user.id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    revalidatePath("/guardia/config");
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export async function deleteGuardiaPeriferico(id: string) {
  try {
    const { user } = await requireAuth();
    const admin = getAdminClient();

    const { error } = await admin
      .from("guardia_perifericos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/guardia/config");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

// ============================================================================
// PARTES
// ============================================================================

export async function getGuardiaPartes(): Promise<ActionResult> {
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("guardia_partes")
      .select("*")
      .is("deleted_at", null)
      .order("fecha", { ascending: false });

    if (error) throw new Error(error.message);
    return { success: true, data: data || [] };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export async function getGuardiaParte(id: string): Promise<ActionResult> {
  try {
    const admin = getAdminClient();

    const { data: parte, error: parteError } = await admin
      .from("guardia_partes")
      .select("*")
      .eq("id", id)
      .single();

    if (parteError) throw new Error(parteError.message);

    const { data: registros } = await admin
      .from("guardia_registros")
      .select("*, area:guardia_areas(*)")
      .eq("guardia_parte_id", id);

    const registroIds = (registros || []).map((r) => r.id);

    let detalles: any[] = [];
    if (registroIds.length > 0) {
      const { data: d } = await admin
        .from("guardia_detalle")
        .select("*, periferico:guardia_perifericos(*)")
        .in("guardia_registro_id", registroIds);
      detalles = d || [];
    }

    const registrosConDetalles = (registros || []).map((r) => ({
      ...r,
      detalles: detalles.filter((d) => d.guardia_registro_id === r.id),
    }));

    return {
      success: true,
      data: { ...parte, registros: registrosConDetalles },
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export async function createGuardiaParte(formData: FormData) {
  try {
    const { user } = await requireAuth();
    const admin = getAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    if (!profile?.organization_id) {
      return { success: false, error: "Sin organizacion asignada" } as ActionResult;
    }

    const validated = guardiaParteSchema.parse({
      fecha: formData.get("fecha") as string,
      observaciones_generales: formData.get("observaciones_generales") as string || null,
    });

    const { data: existe } = await admin
      .from("guardia_partes")
      .select("id")
      .eq("organization_id", profile.organization_id)
      .eq("fecha", validated.fecha)
      .is("deleted_at", null)
      .single();

    if (existe) {
      return { success: false, error: "Ya existe un parte para esta fecha" };
    }

    const { data, error } = await admin
      .from("guardia_partes")
      .insert({
        organization_id: profile.organization_id,
        fecha: validated.fecha,
        observaciones_generales: validated.observaciones_generales,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const { data: areas } = await admin
      .from("guardia_areas")
      .select("id")
      .is("deleted_at", null)
      .eq("activo", true);

    if (areas && areas.length > 0) {
      const registros = areas.map((a) => ({
        guardia_parte_id: data.id,
        area_id: a.id,
        user_id: user.id,
      }));
      await admin.from("guardia_registros").insert(registros);
    }

    revalidatePath("/guardia");
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

// ============================================================================
// ENTREGA
// ============================================================================

export async function saveEntrega(registroId: string, formData: FormData) {
  try {
    const { user } = await requireAuth();
    const admin = getAdminClient();

    // Verificar permisos: solo el dueño o admin/jefe puede editar
    const { data: registro } = await admin
      .from("guardia_registros")
      .select("entregado_por_user_id")
      .eq("id", registroId)
      .single();

    if (registro?.entregado_por_user_id && registro.entregado_por_user_id !== user.id) {
      const { data: profile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (!profile || !["admin", "jefe"].includes(profile.role)) {
        return { success: false, error: "Solo el tecnico que realizo la entrega puede editarla" };
      }
    }

    const detallesRaw = formData.get("detalles") as string;
    const detallesParsed = detallesRaw ? JSON.parse(detallesRaw) : [];

    const validated = guardiaEntregaSchema.parse({
      entregado_por_nombre: formData.get("entregado_por_nombre") as string,
      entregado_por_solapin: formData.get("entregado_por_solapin") as string,
      observaciones: formData.get("observaciones") as string || null,
      detalles: detallesParsed,
    });

    const { error: regError } = await admin
      .from("guardia_registros")
      .update({
        entregado_por_nombre: validated.entregado_por_nombre,
        entregado_por_solapin: validated.entregado_por_solapin,
        entregado_por_user_id: user.id,
        fecha_hora_entrega: new Date().toISOString(),
        observaciones: validated.observaciones,
      })
      .eq("id", registroId);

    if (regError) throw new Error(regError.message);

    for (const d of validated.detalles) {
      const { error: detError } = await admin
        .from("guardia_detalle")
        .upsert({
          guardia_registro_id: registroId,
          periferico_id: d.periferico_id,
          cantidad_entrega: d.cantidad,
          observaciones: d.observaciones,
        }, { onConflict: "guardia_registro_id,periferico_id" });

      if (detError) throw new Error(detError.message);
    }

    revalidatePath("/guardia");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

// ============================================================================
// RECIBO
// ============================================================================

export async function saveRecibo(registroId: string, formData: FormData) {
  try {
    const { user } = await requireAuth();
    const admin = getAdminClient();

    // Verificar permisos: solo el dueño o admin/jefe puede editar
    const { data: registro } = await admin
      .from("guardia_registros")
      .select("recibido_por_user_id")
      .eq("id", registroId)
      .single();

    if (registro?.recibido_por_user_id && registro.recibido_por_user_id !== user.id) {
      const { data: profile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (!profile || !["admin", "jefe"].includes(profile.role)) {
        return { success: false, error: "Solo el tecnico que realizo el recibo puede editarlo" };
      }
    }

    const detallesRaw = formData.get("detalles") as string;
    const detallesParsed = detallesRaw ? JSON.parse(detallesRaw) : [];

    const validated = guardiaReciboSchema.parse({
      recibido_por_nombre: formData.get("recibido_por_nombre") as string,
      recibido_por_solapin: formData.get("recibido_por_solapin") as string,
      observaciones: formData.get("observaciones") as string || null,
      detalles: detallesParsed,
    });

    const { error: regError } = await admin
      .from("guardia_registros")
      .update({
        recibido_por_nombre: validated.recibido_por_nombre,
        recibido_por_solapin: validated.recibido_por_solapin,
        recibido_por_user_id: user.id,
        fecha_hora_recibo: new Date().toISOString(),
        observaciones: validated.observaciones,
      })
      .eq("id", registroId);

    if (regError) throw new Error(regError.message);

    for (const d of validated.detalles) {
      const { error: detError } = await admin
        .from("guardia_detalle")
        .upsert({
          guardia_registro_id: registroId,
          periferico_id: d.periferico_id,
          cantidad_recibo: d.cantidad,
          observaciones: d.observaciones,
        }, { onConflict: "guardia_registro_id,periferico_id" });

      if (detError) throw new Error(detError.message);
    }

    const { data: parteRegistro } = await admin
      .from("guardia_registros")
      .select("guardia_parte_id")
      .eq("id", registroId)
      .single();

    const parteId = parteRegistro?.guardia_parte_id;

    const { data: registros } = await admin
      .from("guardia_registros")
      .select("id, fecha_hora_recibo")
      .eq("guardia_parte_id", parteId);

    const allComplete = registros?.every((r: any) => r.fecha_hora_recibo !== null);

    if (allComplete && parteId) {
      await admin.from("guardia_partes").update({ estado: "completado" }).eq("id", parteId);
    }

    revalidatePath("/guardia");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

// ============================================================================
// COMPLETAR PARTE
// ============================================================================

export async function completarGuardiaParte(parteId: string) {
  try {
    const { user } = await requireAuth();
    const admin = getAdminClient();

    const { data: registros } = await admin
      .from("guardia_registros")
      .select("id, fecha_hora_entrega, fecha_hora_recibo")
      .eq("guardia_parte_id", parteId);

    if (!registros || registros.length === 0) {
      return { success: false, error: "El parte no tiene areas registradas" };
    }

    const allEntregado = registros.every((r) => r.fecha_hora_entrega !== null);
    if (!allEntregado) {
      return { success: false, error: "Todas las areas deben tener entrega completada" };
    }

    const allRecibido = registros.every((r) => r.fecha_hora_recibo !== null);
    const estado = allRecibido ? "completado" : "borrador";

    const { error } = await admin
      .from("guardia_partes")
      .update({ estado })
      .eq("id", parteId);

    if (error) throw new Error(error.message);
    revalidatePath("/guardia");
    revalidatePath(`/guardia/${parteId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

// ============================================================================
// ELIMINAR PARTE
// ============================================================================

export async function deleteGuardiaParte(id: string) {
  try {
    const { user } = await requireAuth();
    const admin = getAdminClient();

    await admin.from("guardia_detalle").delete().in(
      "guardia_registro_id",
      (await admin.from("guardia_registros").select("id").eq("guardia_parte_id", id)).data?.map((r) => r.id) || []
    );
    await admin.from("guardia_registros").delete().eq("guardia_parte_id", id);
    const { error } = await admin.from("guardia_partes").delete().eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/guardia");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}
