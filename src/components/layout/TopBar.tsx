"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function TopBar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 flex justify-between items-center w-full px-5 py-3 sticky top-0 z-40">
      <div className="flex items-center gap-md">
        {/* Mobile menu button */}
        <button
          className="md:hidden text-zinc-400 hover:text-amber-400 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <Link href="/dashboard">
          <h1 className="text-xl font-serif font-black text-amber-500 italic tracking-tight">
            Groom &amp; Gold
          </h1>
        </Link>
      </div>

      <div className="flex items-center gap-md">
        <button className="text-zinc-400 hover:text-amber-400 transition-colors active:scale-95 duration-150">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <div className="text-zinc-400 hover:text-amber-400 transition-colors rounded-full overflow-hidden w-8 h-8 flex items-center justify-center bg-surface-container-highest cursor-pointer">
          <span className="material-symbols-outlined icon-fill text-sm">account_circle</span>
        </div>
        <span className="hidden md:block text-xs text-on-surface-variant font-sans">
          {session?.user?.name}
        </span>
      </div>
    </header>
  );
}
