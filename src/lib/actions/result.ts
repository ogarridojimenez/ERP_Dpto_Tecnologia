import type { ZodError, ZodIssue } from "zod";
import { logger } from "@/lib/logger";

/**
 * Shape estandar de retorno de server actions.
 *
 * - `success: true` con `data` cuando todo va bien.
 * - `success: false` con `error` (mensaje legible) y opcionalmente
 *   `issues` (errores Zod por campo) cuando falla.
 *
 * Convencion: nunca lanzar; siempre devolver este shape.
 */
export type ActionSuccess<T> = { success: true; data: T };
export type ActionFailure = {
  success: false;
  error: string;
  issues?: ZodIssue[];
};
export type ActionResult<T = unknown> = ActionSuccess<T> | ActionFailure;

/**
 * Wrap async logic con manejo uniforme de errores. Convierte:
 * - ZodError → ActionFailure con `issues` populadas.
 * - Error normal → ActionFailure con `error.message`.
 * - Cualquier otro throw → ActionFailure con "Error desconocido".
 *
 * Permite tambien que el callback retorne directamente un
 * ActionFailure (early return), util cuando hay errores de logica
 * de negocio (no auth, recurso no encontrado, etc.).
 *
 * Ejemplo:
 *   export async function saveX(input: unknown) {
 *     return runAction(async () => {
 *       const parsed = schema.parse(input);
 *       const { user } = await requireRole(ROLES.X);
 *       const { error } = await db.from("x").upsert(...);
 *       if (error) throw new Error(error.message);
 *       return { id: parsed.id };
 *     });
 *   }
 */
export async function runAction<T>(
  fn: () => Promise<T | ActionFailure>
): Promise<ActionResult<T>> {
  try {
    const result = await fn();
    if (
      result &&
      typeof result === "object" &&
      "success" in result &&
      result.success === false
    ) {
      return result as ActionFailure;
    }
    return { success: true, data: result as T };
  } catch (e) {
    if (isZodError(e)) {
      return {
        success: false,
        error: "Datos invalidos",
        issues: e.issues,
      };
    }
    const msg = e instanceof Error ? e.message : "Error desconocido";
    logger.error("[action]", msg, e);
    return { success: false, error: msg };
  }
}

/**
 * Fail explicito desde dentro de runAction sin lanzar excepcion.
 *
 *   if (!registro) return fail("Registro no encontrado");
 */
export function fail(error: string, issues?: ZodIssue[]): ActionFailure {
  return { success: false, error, ...(issues ? { issues } : {}) };
}

function isZodError(e: unknown): e is ZodError {
  return (
    typeof e === "object" &&
    e !== null &&
    "issues" in e &&
    Array.isArray((e as { issues?: unknown }).issues) &&
    (e as { name?: string }).name === "ZodError"
  );
}
