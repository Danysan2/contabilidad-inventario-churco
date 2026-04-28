"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", adminOnly: true },
  { href: "/movements", label: "Movimientos", icon: "history", adminOnly: false },
  { href: "/inventory", label: "Inventario", icon: "inventory_2", adminOnly: true },
  { href: "/pos", label: "Punto de Venta", icon: "point_of_sale", adminOnly: false },
  { href: "/settings", label: "Configuración", icon: "settings", adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const visible = navItems.filter((i) => !i.adminOnly || isAdmin);

  return (
    <nav className="bg-zinc-900 border-r border-zinc-800 w-64 hidden md:flex flex-col h-screen sticky top-0">
      {/* User info */}
      <div className="p-lg border-b border-zinc-800 flex items-center gap-md">
        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center overflow-hidden shrink-0">
          <span className="material-symbols-outlined text-outline">person</span>
        </div>
        <div className="overflow-hidden">
          <h2 className="text-on-surface truncate text-sm font-semibold">{session?.user?.name ?? "Usuario"}</h2>
          <p className="text-xs text-on-surface-variant truncate">
            {isAdmin ? "Administrador" : "Empleado"}
          </p>
        </div>
      </div>

      {/* New sale shortcut */}
      <div className="p-4 border-b border-zinc-800">
        <Link
          href="/pos"
          className="w-full bg-surface-container-high hover:bg-surface-container-highest text-primary border border-outline-variant py-2 px-4 rounded flex items-center justify-center gap-sm transition-colors font-label-caps text-label-caps"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva Venta
        </Link>
      </div>

      {/* Nav links */}
      <ul className="flex-1 py-4 flex flex-col gap-unit overflow-y-auto">
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-md pl-4 py-3 transition-all font-sans text-sm font-medium tracking-wide ${
                  active
                    ? "text-primary border-l-2 border-primary bg-zinc-800/50"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <span className={`material-symbols-outlined ${active ? "icon-fill" : ""}`}>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Logout */}
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-md text-zinc-400 pl-4 py-3 hover:bg-zinc-800 hover:text-white transition-all w-full rounded font-sans text-sm font-medium"
        >
          <span className="material-symbols-outlined">logout</span>
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}
