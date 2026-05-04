"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", adminOnly: true },
  { href: "/movements", label: "Movimientos", icon: "history", adminOnly: false },
  { href: "/inventory", label: "Inventario", icon: "inventory_2", adminOnly: false },
  { href: "/pos", label: "Punto de Venta", icon: "point_of_sale", adminOnly: false },
  { href: "/cortes", label: "Cortes", icon: "content_cut", adminOnly: false },
  { href: "/catalogo", label: "Catálogo", icon: "photo_library", adminOnly: false },
  { href: "/ranking", label: "Ranking", icon: "military_tech", adminOnly: false },
  { href: "/egresos", label: "Egresos", icon: "trending_down", adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const visible = navItems.filter((i) => !i.adminOnly || isAdmin);

  return (
    <nav
      className="w-64 hidden md:flex flex-col h-full overflow-y-auto"
      style={{
        background: "linear-gradient(180deg, var(--surface-1) 0%, var(--surface-0) 100%)",
        borderRight: "1px solid rgba(252,85,0,0.08)",
      }}
    >
      {/* User info */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(252,85,0,0.06)" }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold font-display"
          style={{
            background: "rgba(252,85,0,0.12)",
            border: "1px solid rgba(252,85,0,0.2)",
            color: "var(--gold)",
          }}
        >
          {(session?.user?.name ?? "U")[0].toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <p
            className="font-sans text-sm font-semibold truncate"
            style={{ color: "#eae1d4" }}
          >
            {session?.user?.name ?? "Usuario"}
          </p>
          <p
            className="font-sans text-[10px] uppercase tracking-widest truncate"
            style={{ color: "rgba(252,85,0,0.55)" }}
          >
            {isAdmin ? "Administrador" : "Empleado"}
          </p>
        </div>
      </div>

      {/* Nueva Venta CTA */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(252,85,0,0.06)" }}>
        <Link href="/pos" className="btn-gold w-full py-2.5 rounded flex items-center justify-center gap-2">
          <span className="material-symbols-outlined icon-sm">add</span>
          Nueva Venta
        </Link>
      </div>

      {/* Nav */}
      <ul className="flex-1 py-3 flex flex-col overflow-y-auto hide-scrollbar">
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-5 py-3 transition-all font-sans text-sm font-medium ${
                  active ? "nav-active-glow" : ""
                }`}
                style={{
                  color: active ? "var(--gold-light)" : "rgba(234,225,212,0.45)",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = "#eae1d4";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(234,225,212,0.45)";
                }}
              >
                <span
                  className={`material-symbols-outlined ${active ? "icon-fill" : ""}`}
                  style={{ fontSize: 20 }}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Logout */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(252,85,0,0.06)" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-2 py-2.5 w-full rounded font-sans text-sm transition-all"
          style={{ color: "rgba(234,225,212,0.35)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(234,225,212,0.7)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(234,225,212,0.35)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}
