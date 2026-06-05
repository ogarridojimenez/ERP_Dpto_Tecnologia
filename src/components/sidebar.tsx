"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Shield,
  MonitorSpeaker,
  ClipboardList,
  Users,
  LogOut,
  Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const navItems: {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
}[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "jefe", "rrhh", "tecnico", "especialista_hardware"],
  },
  {
    href: "/guardia",
    label: "Guardia",
    icon: Shield,
    roles: ["admin", "jefe", "tecnico"],
  },
  {
    href: "/aulas",
    label: "Aulas",
    icon: MonitorSpeaker,
    roles: ["admin", "jefe", "tecnico", "especialista_hardware"],
  },
  {
    href: "/aft",
    label: "Activos Fijos",
    icon: ClipboardList,
    roles: ["admin", "jefe"],
  },
  {
    href: "/rrhh",
    label: "RRHH",
    icon: Users,
    roles: ["admin", "jefe", "rrhh"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role } = useSupabase();

  async function handleLogout() {
    const { createClient } = await import("@/lib/supabase/client");
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const visibleItems = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white shadow-md shadow-blue-500/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-gray-900">
              SITRADE
            </span>
            <p className="text-[10px] font-medium text-gray-400">
              Depto. de Tecnología
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Módulos
        </p>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 shrink-0",
                  isActive ? "text-blue-600" : "text-gray-400"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="border-t border-gray-100 p-3">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-xs font-bold text-white">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-gray-900">
              {user?.email}
            </p>
            <span className="inline-block rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
              {role}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
