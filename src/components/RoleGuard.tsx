"use client";

import { ProfileRole } from "@/types/database";

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
