"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard",      icon: "dashboard",      adminOnly: true  },
  { href: "/movements", label: "Movimientos",     icon: "history",        adminOnly: false },
  { href: "/inventory", label: "Inventario",      icon: "inventory_2",    adminOnly: false },
  { href: "/pos",       label: "Punto de Venta",  icon: "point_of_sale",  adminOnly: false },
  { href: "/catalogo",  label: "Catálogo",         icon: "photo_library",  adminOnly: false },
  { href: "/ranking",   label: "Ranking",          icon: "military_tech",  adminOnly: false },
  { href: "/egresos",   label: "Egresos",           icon: "trending_down",  adminOnly: true  },
];

export default function TopBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";
  const visible = navItems.filter((i) => !i.adminOnly || isAdmin);

  return (
    <>
      <header
        className="flex justify-between items-center w-full px-5 py-3 sticky top-0 z-40"
        style={{
          background: "rgba(13,11,6,0.88)",
          borderBottom: "1px solid rgba(252,85,0,0.08)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {/* Left: hamburger (mobile) + brand */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 transition-colors"
            style={{ color: "rgba(234,225,212,0.55)" }}
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu</span>
          </button>

          <Link href="/pos" className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "rgba(252,85,0,0.1)",
                border: "1px solid rgba(252,85,0,0.2)",
              }}
            >
              <span
                className="material-symbols-outlined icon-fill"
                style={{ color: "var(--gold)", fontSize: 16 }}
              >
                content_cut
              </span>
            </div>
            <h1 className="font-display text-xl font-bold italic text-gold-gradient">
              ContaChurco
            </h1>
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-display text-sm font-bold cursor-pointer"
              style={{
                background: "rgba(252,85,0,0.12)",
                border: "1px solid rgba(252,85,0,0.22)",
                color: "var(--gold)",
              }}
            >
              {(session?.user?.name ?? "U")[0].toUpperCase()}
            </div>
            <span
              className="hidden md:block font-sans text-xs"
              style={{ color: "rgba(234,225,212,0.45)" }}
            >
              {session?.user?.name}
            </span>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Drawer panel */}
          <nav
            className="absolute left-0 top-0 h-full w-72 flex flex-col animate-fade-in"
            style={{
              background: "linear-gradient(180deg, var(--surface-1) 0%, var(--surface-0) 100%)",
              borderRight: "1px solid rgba(252,85,0,0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(252,85,0,0.08)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-display text-base font-bold"
                  style={{
                    background: "rgba(252,85,0,0.12)",
                    border: "1px solid rgba(252,85,0,0.25)",
                    color: "var(--gold)",
                  }}
                >
                  {(session?.user?.name ?? "U")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-sans text-sm font-semibold" style={{ color: "#eae1d4" }}>
                    {session?.user?.name ?? "Usuario"}
                  </p>
                  <p className="font-sans text-[10px] uppercase tracking-widest" style={{ color: "rgba(252,85,0,0.55)" }}>
                    {isAdmin ? "Administrador" : "Empleado"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ color: "rgba(234,225,212,0.4)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
              </button>
            </div>

            {/* Nueva Venta */}
            <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(252,85,0,0.06)" }}>
              <Link
                href="/pos"
                onClick={() => setDrawerOpen(false)}
                className="btn-gold w-full py-2.5 rounded flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined icon-sm">add</span>
                Nueva Venta
              </Link>
            </div>

            {/* Nav links */}
            <ul className="flex-1 py-3 overflow-y-auto hide-scrollbar">
              {visible.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-3 px-5 py-3 font-sans text-sm font-medium transition-all ${active ? "nav-active-glow" : ""}`}
                      style={{ color: active ? "var(--gold-light)" : "rgba(234,225,212,0.5)" }}
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
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
                Cerrar Sesión
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
