import { requireRole } from "@/lib/auth";
import { Users, Calendar, FileText, GraduationCap, Clock, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RRHH | SITRADE",
  description: "Gestion de Recursos Humanos",
};

const FEATURES = [
  {
    icon: Users,
    title: "Personal",
    description: "Registro, expediente y datos del personal del departamento.",
  },
  {
    icon: Calendar,
    title: "Asistencia y turnos",
    description: "Control de entrada, salida y rotacion de guardias tecnicas.",
  },
  {
    icon: FileText,
    title: "Reportes y vacaciones",
    description: "Solicitudes, aprobaciones y resumen mensual por trabajador.",
  },
  {
    icon: GraduationCap,
    title: "Capacitacion",
    description: "Plan de formacion, cursos impartidos y certificaciones.",
  },
];

export default async function RrhhPage() {
  await requireRole(["admin", "jefe", "rrhh"]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-fuchsia-700 to-purple-800 p-6 text-white shadow-lg md:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                Recursos Humanos
              </h1>
              <p className="mt-1 text-sm text-fuchsia-100 opacity-80 md:text-base">
                Modulo de gestion de personal
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-fuchsia-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">
                Proximamente
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Este modulo esta en planificacion. La estructura base ya esta
                lista y las funcionalidades se iran incorporando por etapas.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1.5 text-xs font-bold text-fuchsia-700 md:self-auto">
            <ShieldCheck className="h-3.5 w-3.5" />
            Acceso restringido
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 px-1 text-sm font-bold uppercase tracking-wider text-gray-500">
          Funcionalidades planificadas
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-fuchsia-300 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-100 to-purple-100 text-fuchsia-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{feature.title}</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
