"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    roles: ["admin", "jefe", "rrhh", "tecnico", "especialista_hardware"],
  },
  {
    href: "/guardia",
    label: "Guardia",
    roles: ["admin", "jefe", "tecnico"],
  },
  {
    href: "/aulas",
    label: "Aulas",
    roles: ["admin", "jefe", "tecnico", "especialista_hardware"],
  },
  {
    href: "/aft",
    label: "Activos Fijos",
    roles: ["admin", "jefe"],
  },
  {
    href: "/rrhh",
    label: "RRHH",
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
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="text-lg font-bold text-gray-900">
          SITRADE
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(item.href)
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="mb-2 truncate text-xs text-gray-500">
          {user?.email}
          <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
            {role}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded-md px-3 py-1.5 text-left text-sm text-gray-600 hover:bg-gray-100"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
