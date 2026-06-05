import Link from "next/link";
import { Shield, MonitorSpeaker, ClipboardList, Users, ArrowRight, Building2, ChevronRight } from "lucide-react";

const modules = [
  {
    title: "Guardia",
    description: "Control de entrega y recibo de periféricos por área. Partes diarios con seguimiento en tiempo real.",
    icon: Shield,
    color: "from-blue-600 to-indigo-700",
    href: "/guardia",
  },
  {
    title: "Control de Aulas",
    description: "Inspección visual del estado de tecnología en aulas y locales. Reportes automáticos.",
    icon: MonitorSpeaker,
    color: "from-emerald-600 to-teal-700",
    href: "/aulas",
  },
  {
    title: "Activos Fijos",
    description: "Inventario y control de activos fijos del departamento. Tarjetas y código QR.",
    icon: ClipboardList,
    color: "from-violet-600 to-purple-700",
    href: "/aft",
  },
  {
    title: "RRHH",
    description: "Gestión de recursos humanos y personal del departamento.",
    icon: Users,
    color: "from-amber-500 to-orange-600",
    href: "/rrhh",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white shadow-lg">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">SITRADE</span>
          </div>
          <Link
            href="/login"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 active:scale-95"
          >
            Iniciar Sesión
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 px-6 pb-20 pt-32">
        {/* Decorative blurs */}
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-60 w-60 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-40 w-40 rounded-full bg-indigo-400/10 blur-2xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-blue-100 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            Facultad de Ciberseguridad — Depto. de Tecnología
          </div>

          <h1 className="mb-6 text-5xl font-black leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            SITRADE
          </h1>
          <p className="mb-4 text-xl font-medium text-blue-100 sm:text-2xl">
            Sistema Integrado de Tecnología, Activos y Departamentos
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-base text-blue-200/80">
            Plataforma centralizada para la gestión de guardia de tecnología,
            control de aulas, inventario de activos fijos y recursos humanos.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="group flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-blue-700 shadow-xl shadow-blue-900/30 transition-all hover:shadow-2xl hover:shadow-blue-900/40 active:scale-95"
            >
              Iniciar Sesión
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#modulos"
              className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95"
            >
              Conocer Módulos
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modulos" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-black tracking-tight text-gray-900">
              Módulos del Sistema
            </h2>
            <p className="text-base text-gray-500">
              Herramientas diseñadas para la gestión eficiente del departamento
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.title}
                  href={mod.href}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/50"
                >
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${mod.color} text-white shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-gray-900">{mod.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-gray-500">{mod.description}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors group-hover:text-blue-700">
                    Acceder
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-gray-100 bg-gray-50 px-6 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { label: "Áreas Controladas", value: "15+" },
            { label: "Periféricos", value: "200+" },
            { label: "Usuarios Activos", value: "30+" },
            { label: "Módulos", value: "4" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-black text-blue-700">{stat.value}</p>
              <p className="mt-1 text-sm font-medium text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 border-t border-gray-200 pt-8 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-700 to-indigo-800 text-white">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">SITRADE</p>
                <p className="text-xs text-gray-500">Depto. de Tecnología</p>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400">
               © 2026 Facultad de Ciberseguridad — Universidad de las Ciencias Informáticas
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
