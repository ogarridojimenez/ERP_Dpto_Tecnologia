"use server";

import { revalidatePath } from "next/cache";
import { areaAftSchema, controlAftSchema, uuidSchema, syncScansSchema } from "@/lib/schemas/aft";
import { requireAuth, requireRole, ROLES, getAdminClient } from "@/lib/auth";

type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ============================================================================
// ÁREAS AFT
// ============================================================================

export async function createArea(formData: FormData) {
  try {
    const { user } = await requireRole(ROLES.AFT_ADMIN);
    const admin = getAdminClient();

    const { data: profile } = await admin.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!profile?.organization_id) {
      return { success: false, error: "Sin organización asignada" } as ActionResult;
    }

    const validated = areaAftSchema.parse({
      codigo: formData.get("codigo") as string,
      nombre: formData.get("nombre") as string,
      activo: formData.get("activo") === "on" || formData.get("activo") === "true",
    });

    const { data, error } = await admin
      .from("areas_aft")
      .insert({
        ...validated,
        organization_id: profile.organization_id,
        user_id: user.id,
      })
      .select("id, codigo, nombre")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Ya existe un área con ese código" } as ActionResult;
      }
      return { success: false, error: error.message } as ActionResult;
    }

    revalidatePath("/aft/areas");
    return { success: true, data } as ActionResult<{ id: string; codigo: string; nombre: string }>;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}

export async function updateArea(id: string, formData: FormData) {
  try {
    await requireRole(ROLES.AFT_ADMIN);
    const admin = getAdminClient();

    const validated = areaAftSchema.parse({
      codigo: formData.get("codigo") as string,
      nombre: formData.get("nombre") as string,
      activo: formData.get("activo") === "on" || formData.get("activo") === "true",
    });

    const { error } = await admin
      .from("areas_aft")
      .update(validated)
      .eq("id", id);

    if (error) return { success: false, error: error.message } as ActionResult;

    revalidatePath("/aft/areas");
    revalidatePath(`/aft/areas/${id}`);
    return { success: true } as ActionResult;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}

export async function deleteArea(id: string) {
  try {
    const validatedId = uuidSchema.parse(id);
    await requireRole(ROLES.AFT_ADMIN);
    const admin = getAdminClient();

    const { data: controles } = await admin
      .from("controles_aft")
      .select("id")
      .eq("area_id", id)
      .is("deleted_at", null);

    if (controles && controles.length > 0) {
      return { success: false, error: `No se puede eliminar: el área tiene ${controles.length} control(es) asociado(s)` } as ActionResult;
    }

    const { error } = await admin
      .from("areas_aft")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", validatedId);

    if (error) return { success: false, error: error.message } as ActionResult;

    revalidatePath("/aft/areas");
    return { success: true } as ActionResult;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}

// ============================================================================
// UPLOAD EXCEL PARA ÁREA (reemplaza mb_area)
// ============================================================================

export async function uploadAreaExcel(areaId: string, formData: FormData) {
  try {
    const validatedId = uuidSchema.parse(areaId);
    const { user } = await requireRole(ROLES.AFT_ADMIN);
    const admin = getAdminClient();

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No se proporcionó archivo" } as ActionResult;
    }

    const XLSX = await import("xlsx");
    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    const MB_REGEX = /^(mb|MB)\d+/;
    const mbs: Array<{ mb: string; descripcion: string | null }> = [];

    for (const row of rows) {
      let mbValue: string | null = null;
      let descripcion: string | null = null;

      for (let i = 0; i < row.length; i++) {
        const cell = String(row[i] || "").trim();
        if (MB_REGEX.test(cell)) {
          mbValue = cell.replace(/\s+/g, "").toUpperCase();
          if (i + 1 < row.length) {
            const next = String(row[i + 1] || "").trim();
            if (next && !MB_REGEX.test(next) && isNaN(Number(next))) {
              descripcion = next;
            }
          }
          if (!descripcion) {
            for (let j = i + 1; j < Math.min(i + 5, row.length); j++) {
              const next = String(row[j] || "").trim();
              if (next && !MB_REGEX.test(next) && !/^\d+(\.\d+)?$/.test(next)) {
                descripcion = next;
                break;
              }
            }
          }
          break;
        }
      }

      if (mbValue) {
        mbs.push({ mb: mbValue, descripcion });
      }
    }

    if (mbs.length === 0) {
      return { success: false, error: "No se encontraron MBs válidos en el Excel (formato: mb000012345)" } as ActionResult;
    }

    const { error: delErr } = await admin
      .from("mb_area")
      .delete()
      .eq("area_id", validatedId);

    if (delErr) return { success: false, error: "Error limpiando MBs anteriores: " + delErr.message } as ActionResult;

    const records = mbs.map(m => ({
      area_id: validatedId,
      mb: m.mb,
      descripcion: m.descripcion,
      user_id: user.id,
    }));

    const { error: insErr } = await admin
      .from("mb_area")
      .insert(records);

    if (insErr) return { success: false, error: "Error guardando MBs: " + insErr.message } as ActionResult;

    revalidatePath(`/aft/areas/${validatedId}`);
    return {
      success: true,
      data: { count: mbs.length, mbs }
    } as ActionResult;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}

// ============================================================================
// CONTROLES AFT
// ============================================================================

export async function createControl(formData: FormData) {
  try {
    const { user } = await requireRole(ROLES.AFT_ADMIN);
    const admin = getAdminClient();

    const { data: profile } = await admin.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!profile?.organization_id) {
      return { success: false, error: "Sin organización asignada" } as ActionResult;
    }

    const areaId = formData.get("area_id") as string;
    if (!areaId) {
      return { success: false, error: "El área es obligatoria" } as ActionResult;
    }

    const { count: mbCount } = await admin
      .from("mb_area")
      .select("*", { count: "exact", head: true })
      .eq("area_id", areaId);

    if (!mbCount || mbCount === 0) {
      return { success: false, error: "El área no tiene MBs cargados. Sube un Excel primero." } as ActionResult;
    }

    const validated = controlAftSchema.parse({
      area_id: areaId,
      fecha_planificada: formData.get("fecha_planificada") as string,
      estado: (formData.get("estado") as string) || "en_curso",
      observaciones: formData.get("observaciones") as string,
    });

    const { data: control, error: cErr } = await admin
      .from("controles_aft")
      .insert({
        ...validated,
        organization_id: profile.organization_id,
        user_id: user.id,
      })
      .select()
      .single();

    if (cErr) return { success: false, error: cErr.message } as ActionResult;

    const { data: mbs } = await admin
      .from("mb_area")
      .select("mb, descripcion")
      .eq("area_id", areaId);

    if (mbs && mbs.length > 0) {
      const activos = mbs.map(m => ({
        control_id: control.id,
        mb: m.mb,
        descripcion: m.descripcion,
        escaneado: false,
        user_id: user.id,
      }));

      const { error: aErr } = await admin
        .from("activos_aft")
        .insert(activos);

      if (aErr) {
        await admin.from("controles_aft").delete().eq("id", control.id);
        return { success: false, error: "Error creando esperados: " + aErr.message } as ActionResult;
      }
    }

    revalidatePath("/aft");
    return { success: true, data: control } as ActionResult;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}

export async function completeControl(controlId: string) {
  try {
    const validatedId = uuidSchema.parse(controlId);
    await requireRole(ROLES.AFT_ADMIN);
    const admin = getAdminClient();

    const { error } = await admin
      .from("controles_aft")
      .update({
        estado: "completado",
        fecha_realizada: new Date().toISOString().split("T")[0],
      })
      .eq("id", validatedId);

    if (error) return { success: false, error: error.message } as ActionResult;

    revalidatePath(`/aft/controles/${validatedId}`);
    revalidatePath("/aft");
    revalidatePath("/aft/historial");
    return { success: true } as ActionResult;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}

export async function cancelControl(controlId: string) {
  try {
    const validatedId = uuidSchema.parse(controlId);
    await requireRole(ROLES.AFT_ADMIN);
    const admin = getAdminClient();

    const { error } = await admin
      .from("controles_aft")
      .update({ estado: "cancelado" })
      .eq("id", validatedId);

    if (error) return { success: false, error: error.message } as ActionResult;

    revalidatePath(`/aft/controles/${validatedId}`);
    revalidatePath("/aft");
    return { success: true } as ActionResult;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}

export async function deleteControl(controlId: string) {
  try {
    const validatedId = uuidSchema.parse(controlId);
    await requireRole(ROLES.AFT_ADMIN);
    const admin = getAdminClient();

    const { error } = await admin
      .from("controles_aft")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", validatedId);

    if (error) return { success: false, error: error.message } as ActionResult;

    revalidatePath("/aft");
    revalidatePath("/aft/historial");
    revalidatePath(`/aft/controles/${validatedId}`);
    return { success: true } as ActionResult;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}

// ============================================================================
// CONCILIACIÓN (lectura: cualquier autenticado)
// ============================================================================

export type ReconciliationResult = {
  success: boolean;
  data?: {
    control: {
      id: string;
      area_codigo: string;
      area_nombre: string;
      fecha_planificada: string;
      fecha_realizada: string | null;
      estado: string;
    };
    expected: number;
    scanned: number;
    missing: Array<{ mb: string; descripcion: string | null }>;
    surplus: Array<{ mb: string; descripcion: string | null }>;
    accuracy: number;
  };
  error?: string;
};

export async function getReconciliation(controlId: string): Promise<ReconciliationResult> {
  try {
    const validatedId = uuidSchema.parse(controlId);
    await requireAuth();
    const admin = getAdminClient();

    const { data: control, error: cErr } = await admin
      .from("controles_aft")
      .select("id, area_id, fecha_planificada, fecha_realizada, estado, areas_aft(codigo, nombre)")
      .eq("id", validatedId)
      .maybeSingle();

    if (cErr || !control) {
      return { success: false, error: cErr?.message || "Control no encontrado" };
    }

    const { data: activos, error: aErr } = await admin
      .from("activos_aft")
      .select("mb, descripcion, escaneado, fecha_escaneo")
      .eq("control_id", validatedId)
      .order("mb");

    if (aErr) return { success: false, error: aErr.message };

    const expected = activos || [];
    const escaneados = expected.filter(a => a.escaneado);
    const faltantes = expected
      .filter(a => !a.escaneado)
      .map(a => ({ mb: a.mb, descripcion: a.descripcion }));

    const accuracy = expected.length > 0 ? Math.round((escaneados.length / expected.length) * 100) : 0;

    const areaInfo = (control as any).areas_aft;

    return {
      success: true,
      data: {
        control: {
          id: control.id,
          area_codigo: areaInfo?.codigo || "?",
          area_nombre: areaInfo?.nombre || "?",
          fecha_planificada: control.fecha_planificada,
          fecha_realizada: control.fecha_realizada,
          estado: control.estado,
        },
        expected: expected.length,
        scanned: escaneados.length,
        missing: faltantes,
        surplus: [],
        accuracy,
      },
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ============================================================================
// SINCRONIZACIÓN DESDE APP MÓVIL (cualquier autenticado)
// ============================================================================

export async function syncScans(data: {
  control_id: string;
  scans: string[];
}) {
  try {
    const validated = syncScansSchema.parse(data);
    const { user } = await requireAuth();
    const admin = getAdminClient();

    if (!validated.scans || validated.scans.length === 0) {
      return { success: true, data: { synced: 0 } } as ActionResult;
    }

    const mbs = validated.scans.map(m => m.trim().toUpperCase());

    const { error, count } = await admin
      .from("activos_aft")
      .update({
        escaneado: true,
        fecha_escaneo: new Date().toISOString(),
        user_id: user.id,
      })
      .eq("control_id", validated.control_id)
      .in("mb", mbs);

    if (error) return { success: false, error: error.message } as ActionResult;

    revalidatePath(`/aft/controles/${validated.control_id}`);
    return { success: true, data: { synced: count || 0 } } as ActionResult;
  } catch (e) {
    return { success: false, error: (e as Error).message } as ActionResult;
  }
}


