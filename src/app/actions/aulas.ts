"use server";

import { revalidatePath } from "next/cache";
import {
  iniciarSessionSchema,
  guardarRevisionLocalSchema,
  eliminarSessionSchema,
} from "@/lib/schemas/aulas";
import { requireAuth, requireRole, ROLES, getAdminClient } from "@/lib/auth";
import { uuidSchema } from "@/lib/schemas/aft";

type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ============================================================================
// LECTURA (cualquier autenticado)
// ============================================================================

export async function obtenerLocalesConMedios() {
  try {
    await requireAuth();
    const admin = getAdminClient();

    const { data: locales, error: lErr } = await admin
      .from("locales")
      .select("id, codigo, nombre, tipo, estado, observaciones")
      .is("deleted_at", null)
      .order("codigo");

    if (lErr) return { success: false, error: lErr.message } as ActionResult;
    if (!locales) return { success: true, data: [] } as ActionResult;

    const { data: medios, error: mErr } = await admin
      .from("medios")
      .select("id, codigo, nombre, locale_id, tipo_medio_id, estado, marca, modelo")
      .is("deleted_at", null);

    if (mErr) return { success: false, error: mErr.message } as ActionResult;

    const mediosPorLocal: Record<string, typeof medios> = {};
    for (const m of medios || []) {
      if (!mediosPorLocal[m.locale_id]) mediosPorLocal[m.locale_id] = [];
      mediosPorLocal[m.locale_id].push(m);
    }

    const data = locales.map((l) => ({
      ...l,
      medios: mediosPorLocal[l.id] || [],
    }));

    return { success: true, data } as ActionResult<typeof data>;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}

export async function obtenerSesiones() {
  try {
    await requireAuth();
    const admin = getAdminClient();

    const { data, error } = await admin
      .from("visitas_aulas")
      .select(`
        session_id,
        revisor,
        fecha_visita,
        locale_id,
        estado_general,
        observaciones_generales,
        deleted_at
      `)
      .not("session_id", "is", null)
      .is("deleted_at", null)
      .order("fecha_visita", { ascending: false });

    if (error) return { success: false, error: error.message } as ActionResult;

    const sesiones: Record<string, {
      session_id: string;
      revisor: string;
      fecha_visita: string;
      total: number;
      revisados: number;
      con_problemas: number;
    }> = {};

    for (const v of data || []) {
      if (!v.session_id) continue;
      if (!sesiones[v.session_id]) {
        sesiones[v.session_id] = {
          session_id: v.session_id,
          revisor: v.revisor,
          fecha_visita: v.fecha_visita,
          total: 0,
          revisados: 0,
          con_problemas: 0,
        };
      }
      sesiones[v.session_id].total++;
      if (v.estado_general) {
        sesiones[v.session_id].revisados++;
        if (v.estado_general === "mal" || v.estado_general === "regular") {
          sesiones[v.session_id].con_problemas++;
        }
      }
    }

    return {
      success: true,
      data: Object.values(sesiones).sort(
        (a, b) => new Date(b.fecha_visita).getTime() - new Date(a.fecha_visita).getTime()
      ),
    } as ActionResult;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}

export async function obtenerSession(sessionId: string) {
  try {
    const validatedId = uuidSchema.parse(sessionId);
    await requireAuth();
    const admin = getAdminClient();

    const { data: visitas, error: vErr } = await admin
      .from("visitas_aulas")
      .select(`
        id, session_id, locale_id, fecha_visita, revisor,
        estado_general, observaciones_generales, created_at,
        locales!inner(codigo, nombre, tipo)
      `)
      .eq("session_id", validatedId)
      .is("deleted_at", null)
      .order("locales(codigo)");

    if (vErr) return { success: false, error: vErr.message } as ActionResult;
    if (!visitas || visitas.length === 0) {
      return { success: false, error: "Sesión no encontrada" } as ActionResult;
    }

    const visitaIds = visitas.map((v) => v.id);

    const { data: detalles, error: dErr } = await admin
      .from("detalles_visita")
      .select(`
        id, visita_id, medio_id, estado, observaciones,
        medios!inner(codigo, nombre)
      `)
      .in("visita_id", visitaIds)
      .is("deleted_at", null);

    if (dErr) return { success: false, error: dErr.message } as ActionResult;

    const detallesPorVisita: Record<string, typeof detalles> = {};
    for (const d of detalles || []) {
      if (!detallesPorVisita[d.visita_id]) detallesPorVisita[d.visita_id] = [];
      detallesPorVisita[d.visita_id].push(d);
    }

    const data = visitas.map((v) => ({
      ...v,
      detalles: detallesPorVisita[v.id] || [],
    }));

    return { success: true, data } as ActionResult<typeof data>;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}

// ============================================================================
// ESCRITURA (admin, jefe, especialista_hardware)
// ============================================================================

export async function iniciarSession(formData: FormData) {
  try {
    const { user } = await requireRole(ROLES.AULAS_ADMIN);
    const admin = getAdminClient();

    const raw = {
      revisor: formData.get("revisor") as string,
      fecha_visita: formData.get("fecha_visita") as string,
    };

    const parsed = iniciarSessionSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(". "),
      } as ActionResult;
    }

    const { data: locales, error: lErr } = await admin
      .from("locales")
      .select("id, codigo, estado")
      .is("deleted_at", null)
      .neq("estado", "inactivo");

    if (lErr) return { success: false, error: lErr.message } as ActionResult;

    const sessionId = crypto.randomUUID();

    const visitas = locales.map((l) => ({
      organization_id: "00000000-0000-0000-0000-000000000001",
      session_id: sessionId,
      locale_id: l.id,
      fecha_visita: parsed.data.fecha_visita,
      revisor: parsed.data.revisor,
      estado_general: null,
      user_id: user.id,
    }));

    const { error: vErr } = await admin.from("visitas_aulas").insert(visitas);
    if (vErr) return { success: false, error: vErr.message } as ActionResult;

    revalidatePath("/aulas");
    return { success: true, data: { session_id: sessionId } } as ActionResult;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}

export async function guardarRevisionLocal(formData: FormData) {
  try {
    const { user } = await requireRole(ROLES.AULAS_ADMIN);
    const admin = getAdminClient();

    const rawDetalles: Array<{ medio_id: string; estado: string; observaciones: string }> = [];
    let i = 0;
    while (formData.has(`detalles[${i}][medio_id]`)) {
      rawDetalles.push({
        medio_id: formData.get(`detalles[${i}][medio_id]`) as string,
        estado: formData.get(`detalles[${i}][estado]`) as string,
        observaciones: (formData.get(`detalles[${i}][observaciones]`) as string) || "",
      });
      i++;
    }

    const raw = {
      visita_id: formData.get("visita_id") as string,
      estado_general: formData.get("estado_general") as string,
      observaciones_generales: (formData.get("observaciones_generales") as string) || "",
      detalles: rawDetalles,
    };

    const parsed = guardarRevisionLocalSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(". "),
      } as ActionResult;
    }

    const { error: vErr } = await admin
      .from("visitas_aulas")
      .update({
        estado_general: parsed.data.estado_general,
        observaciones_generales: parsed.data.observaciones_generales,
      })
      .eq("id", parsed.data.visita_id)
      .eq("user_id", user.id);

    if (vErr) return { success: false, error: vErr.message } as ActionResult;

    for (const detalle of parsed.data.detalles) {
      const { error: dErr } = await admin.from("detalles_visita").upsert(
        {
          visita_id: parsed.data.visita_id,
          medio_id: detalle.medio_id,
          estado: detalle.estado,
          observaciones: detalle.observaciones || null,
          user_id: user.id,
        },
        {
          onConflict: "visita_id, medio_id",
          ignoreDuplicates: false,
        }
      );
      if (dErr) return { success: false, error: dErr.message } as ActionResult;
    }

    revalidatePath("/aulas");
    return { success: true } as ActionResult;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}

export async function eliminarSession(formData: FormData) {
  try {
    await requireRole(ROLES.AULAS_ADMIN);
    const admin = getAdminClient();

    const raw = { session_id: formData.get("session_id") as string };
    const parsed = eliminarSessionSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: "ID de sesión inválido" } as ActionResult;
    }

    const { error } = await admin
      .from("visitas_aulas")
      .update({ deleted_at: new Date().toISOString() })
      .eq("session_id", parsed.data.session_id);

    if (error) return { success: false, error: error.message } as ActionResult;

    revalidatePath("/aulas");
    return { success: true } as ActionResult;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}

export async function toggleBloqueoLocal(localeId: string) {
  try {
    const validatedId = uuidSchema.parse(localeId);
    await requireRole(ROLES.AULAS_ADMIN);
    const admin = getAdminClient();

    const { data: locale, error: lErr } = await admin
      .from("locales")
      .select("estado")
      .eq("id", validatedId)
      .single();

    if (lErr) return { success: false, error: lErr.message } as ActionResult;

    const nuevoEstado = locale.estado === "inactivo" ? "activo" : "inactivo";

    const { error: uErr } = await admin
      .from("locales")
      .update({ estado: nuevoEstado })
      .eq("id", validatedId);

    if (uErr) return { success: false, error: uErr.message } as ActionResult;

    revalidatePath("/aulas");
    return { success: true, data: { estado: nuevoEstado } } as ActionResult;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}

export async function crearLocal(formData: FormData) {
  try {
    const { user } = await requireRole(ROLES.AULAS_ADMIN);
    const admin = getAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const raw = {
      codigo: (formData.get("codigo") as string)?.trim().toUpperCase(),
      nombre: (formData.get("nombre") as string)?.trim(),
      tipo: formData.get("tipo") as string,
      observaciones: (formData.get("observaciones") as string)?.trim() || null,
    };

    if (!raw.codigo || raw.codigo.length < 2) {
      return { success: false, error: "El código del local debe tener al menos 2 caracteres" } as ActionResult;
    }
    if (!["aula", "salon", "laboratorio", "oficina", "almacen", "otro"].includes(raw.tipo)) {
      return { success: false, error: "Tipo de local inválido" } as ActionResult;
    }

    const { data: nuevo, error: cErr } = await admin
      .from("locales")
      .insert({
        organization_id: profile?.organization_id ?? null,
        codigo: raw.codigo,
        nombre: raw.nombre || raw.codigo,
        tipo: raw.tipo,
        estado: "activo",
        observaciones: raw.observaciones,
        user_id: user.id,
      })
      .select("id, codigo")
      .single();

    if (cErr) return { success: false, error: cErr.message } as ActionResult;

    revalidatePath("/aulas");
    return { success: true, data: nuevo } as ActionResult;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}

export async function eliminarLocal(formData: FormData) {
  try {
    await requireRole(ROLES.AULAS_ADMIN);
    const admin = getAdminClient();

    const localeId = formData.get("locale_id") as string;
    if (!localeId) return { success: false, error: "ID de local requerido" } as ActionResult;

    const validatedId = uuidSchema.parse(localeId);

    const { error: dErr } = await admin
      .from("locales")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", validatedId);

    if (dErr) return { success: false, error: dErr.message } as ActionResult;

    revalidatePath("/aulas");
    return { success: true } as ActionResult;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}
