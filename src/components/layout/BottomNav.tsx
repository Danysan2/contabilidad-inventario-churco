"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const navItems = [
  { href: "/pos",       label: "Ventas",    icon: "shopping_basket", adminOnly: false },
  { href: "/cortes",    label: "Cortes",    icon: "content_cut",     adminOnly: false },
  { href: "/catalogo",  label: "Catálogo",  icon: "photo_library",   adminOnly: false },
  { href: "/ranking",   label: "Ranking",   icon: "military_tech",   adminOnly: false },
  { href: "/dashboard", label: "Dashboard", icon: "dashboard",       adminOnly: true  },
  { href: "/movements", label: "Historial", icon: "receipt_long",    adminOnly: false },
  { href: "/inventory", label: "Stock",     icon: "inventory",       adminOnly: false },
  { href: "/egresos",   label: "Egresos",   icon: "trending_down",   adminOnly: true  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const visible = navItems.filter((i) => !i.adminOnly || isAdmin);

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2 md:hidden"
      style={{
        background: "rgba(13,11,6,0.92)",
        borderTop: "1px solid rgba(252,85,0,0.1)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {visible.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 min-w-[52px] py-1 relative transition-all"
            style={{
              color: active ? "var(--gold-light)" : "rgba(234,225,212,0.35)",
              transform: active ? "scale(1.08)" : "scale(1)",
            }}
          >
            {/* Active glow dot */}
            {active && (
              <span
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{
                  background: "var(--gold)",
                  boxShadow: "0 0 6px 2px rgba(252,85,0,0.5)",
                }}
              />
            )}

            <span
              className={`material-symbols-outlined ${active ? "icon-fill" : ""}`}
              style={{ fontSize: 22 }}
            >
              {item.icon}
            </span>
            <span
              className="font-sans text-[9px] uppercase font-bold tracking-wider"
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
