"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function TopBar() {
  const { data: session } = useSession();

  return (
    <header
      className="flex justify-between items-center w-full px-5 py-3 sticky top-0 z-40"
      style={{
        background: "rgba(13,11,6,0.85)",
        borderBottom: "1px solid rgba(212,175,55,0.08)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* Brand */}
      <Link href="/pos" className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.2)",
          }}
        >
          <span
            className="material-symbols-outlined icon-fill"
            style={{ color: "var(--gold)", fontSize: 16 }}
          >
            content_cut
          </span>
        </div>
        <h1
          className="font-display text-xl font-bold italic text-gold-gradient"
        >
          Groom &amp; Gold
        </h1>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button
          className="transition-colors"
          style={{ color: "rgba(234,225,212,0.4)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--gold-light)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(234,225,212,0.4)")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>notifications</span>
        </button>

        {/* Avatar + name */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-display text-sm font-bold cursor-pointer"
            style={{
              background: "rgba(212,175,55,0.12)",
              border: "1px solid rgba(212,175,55,0.22)",
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
  );
}
