"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const navItems = [
  { href: "/pos", label: "POS", icon: "shopping_basket", adminOnly: false },
  { href: "/catalogo", label: "Catálogo", icon: "photo_library", adminOnly: false },
  { href: "/ranking", label: "Ranking", icon: "military_tech", adminOnly: false },
  { href: "/movements", label: "Historial", icon: "receipt_long", adminOnly: false },
  { href: "/inventory", label: "Stock", icon: "inventory", adminOnly: true },
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", adminOnly: true },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const visible = navItems.filter((i) => !i.adminOnly || isAdmin);

  return (
    <nav className="bg-zinc-950/95 border-t border-zinc-800 shadow-2xl fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 backdrop-blur-md md:hidden">
      {visible.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center font-sans text-[10px] uppercase font-bold gap-1 transition-transform ${
              active ? "text-amber-500 scale-110" : "text-zinc-500 hover:text-amber-400"
            }`}
          >
            <span className={`material-symbols-outlined ${active ? "icon-fill" : ""}`}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
