"use client";

import { ProfileRole } from "@/types/database";

/**
 * RoleGuard — defensa COSMETICA, no de seguridad.
 *
 * Oculta UI cuando el rol del usuario no esta en allowedRoles. Util
 * para no mostrar botones/secciones que el backend va a rechazar.
 *
 * NO confiar en este componente como capa de seguridad:
 * - El rol llega del cliente, donde puede ser manipulado.
 * - Aunque el componente no renderice, los datos del modulo igual
 *   pueden haber bajado al bundle JS.
 *
 * La seguridad REAL vive en:
 * 1. middleware (Next.js) — bloquea rutas /aft, /guardia, etc. sin sesion.
 * 2. requireRole() en server actions — valida en el servidor.
 * 3. RLS policies en Supabase — ultima linea de defensa en BD.
 */
type Props = {
  userRole: ProfileRole;
  allowedRoles: ProfileRole[];
  children: React.ReactNode;
};

const ROLE_LABELS: Record<ProfileRole, string> = {
  admin: "Administrador",
  jefe: "Jefe de Departamento",
  rrhh: "Recursos Humanos",
  tecnico: "Técnico",
  especialista_hardware: "Especialista de Hardware",
};

export function RoleGuard({ userRole, allowedRoles, children }: Props) {
  if (allowedRoles.includes(userRole)) {
    return <>{children}</>;
  }

  return (
    <div className="m-6 rounded-2xl border border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔒</span>
        <div>
          <h2 className="text-lg font-bold text-red-800">Acceso Restringido</h2>
          <p className="mt-1 text-sm text-red-700">
            Tu rol actual <strong>({ROLE_LABELS[userRole]})</strong> no tiene permisos para acceder a esta sección.
          </p>
          <p className="mt-2 text-xs text-red-600">
            Roles permitidos: {allowedRoles.map((r) => ROLE_LABELS[r]).join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
}
