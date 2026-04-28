"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

type RankedProduct = {
  rank: number;
  product: { id: string; name: string; image: string | null; category: { name: string } };
  totalUnits: number;
  totalRevenue: number;
};

type RankingData = {
  ranking: RankedProduct[];
  year: number;
  month: number;
};

const MEDAL = ["🥇", "🥈", "🥉"] as const;
const MEDAL_COLORS = [
  "border-[#d4af37] bg-[#d4af37]/10",
  "border-[#9ca3af] bg-[#9ca3af]/10",
  "border-[#cd7f32] bg-[#cd7f32]/10",
];
const MEDAL_TEXT = ["text-[#d4af37]", "text-[#9ca3af]", "text-[#cd7f32]"];

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function RankingPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ranking?year=${year}&month=${month}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetch_(); }, [fetch_]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
    if (isFuture) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const top3 = data?.ranking.slice(0, 3) ?? [];
  const rest = data?.ranking.slice(3) ?? [];
  const maxUnits = data?.ranking[0]?.totalUnits ?? 1;
  const totalUnits = data?.ranking.reduce((s, r) => s + r.totalUnits, 0) ?? 0;
  const totalRevenue = data?.ranking.reduce((s, r) => s + r.totalRevenue, 0) ?? 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
        <div>
          <h2 className="font-serif text-headline-md text-on-surface mb-xs">Ranking de Productos</h2>
          <p className="text-on-surface-variant font-sans text-sm">
            Productos más vendidos por mes.
          </p>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-sm bg-surface-container border border-outline-variant rounded-lg px-2 py-1">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <span className="font-serif text-on-surface min-w-[140px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-md">
          <div className="grid grid-cols-3 gap-md">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-container border border-outline-variant rounded-xl h-48 animate-pulse" />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-surface-container border border-outline-variant rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : data?.ranking.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-3">bar_chart</span>
          <p className="font-serif text-headline-sm text-on-surface mb-1">Sin ventas registradas</p>
          <p className="font-sans text-sm">No hubo ventas en {MONTH_NAMES[month - 1]} {year}.</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-md mb-xl">
            <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">UNIDADES VENDIDAS</p>
              <p className="font-serif text-3xl font-bold text-on-surface">{totalUnits.toLocaleString("es-MX")}</p>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">INGRESOS GENERADOS</p>
              <p className="font-serif text-3xl font-bold text-primary">${totalRevenue.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            </div>
          </div>

          {/* Top 3 podium */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-xl">
              {top3.map((item) => (
                <div
                  key={item.product.id}
                  className={`border rounded-xl p-lg flex flex-col items-center text-center gap-sm transition-colors ${MEDAL_COLORS[item.rank - 1]}`}
                >
                  <span className="text-3xl">{MEDAL[item.rank - 1]}</span>
                  <div className="w-20 h-20 rounded-xl bg-surface-container-high overflow-hidden border border-outline-variant shrink-0">
                    {item.product.image ? (
                      <Image
                        src={item.product.image.startsWith("http") ? item.product.image : `/imagenes/${encodeURIComponent(item.product.image)}`}
                        alt={item.product.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-contain p-2"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-outline text-[32px]">inventory_2</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className={`font-serif font-bold text-base leading-tight ${MEDAL_TEXT[item.rank - 1]}`}>{item.product.name}</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">{item.product.category.name}</p>
                  </div>
                  <div className="mt-auto pt-sm border-t border-outline-variant w-full">
                    <p className="font-sans font-bold text-on-surface text-lg">{item.totalUnits.toLocaleString("es-MX")} <span className="text-xs text-on-surface-variant font-normal">uds</span></p>
                    <p className="text-primary text-sm font-sans">${item.totalRevenue.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rest of ranking */}
          {rest.length > 0 && (
            <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[40px_60px_1fr_120px_140px_120px] gap-md px-md py-sm border-b border-[#2A2A2A] font-label-caps text-label-caps text-on-surface-variant">
                <div>#</div>
                <div></div>
                <div>Producto</div>
                <div>Categoría</div>
                <div className="text-right">Unidades</div>
                <div className="text-right">Ingresos</div>
              </div>

              {rest.map((item) => {
                const pct = Math.round((item.totalUnits / maxUnits) * 100);
                return (
                  <div
                    key={item.product.id}
                    className="grid grid-cols-1 md:grid-cols-[40px_60px_1fr_120px_140px_120px] gap-x-md gap-y-xs px-md py-sm border-b border-[#2A2A2A] last:border-0 items-center hover:bg-surface-container transition-colors group"
                  >
                    <div className="hidden md:block font-sans text-sm font-bold text-on-surface-variant">#{item.rank}</div>

                    <div className="hidden md:block w-12 h-12 rounded-lg bg-surface-container-high overflow-hidden shrink-0">
                      {item.product.image ? (
                        <Image
                          src={item.product.image.startsWith("http") ? item.product.image : `/imagenes/${encodeURIComponent(item.product.image)}`}
                          alt={item.product.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-contain p-1"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-outline text-[20px]">inventory_2</span>
                        </div>
                      )}
                    </div>

                    {/* Mobile: rank + name inline */}
                    <div className="flex items-center gap-sm md:hidden">
                      <span className="font-sans text-xs font-bold text-on-surface-variant w-6">#{item.rank}</span>
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high overflow-hidden shrink-0">
                        {item.product.image ? (
                          <Image
                            src={item.product.image.startsWith("http") ? item.product.image : `/imagenes/${encodeURIComponent(item.product.image)}`}
                            alt={item.product.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-contain p-1"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-outline text-[16px]">inventory_2</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-sans font-semibold text-sm text-on-surface">{item.product.name}</p>
                        <p className="text-xs text-on-surface-variant">{item.product.category.name}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="font-sans font-bold text-on-surface text-sm">{item.totalUnits} <span className="text-xs font-normal text-on-surface-variant">uds</span></p>
                        <p className="text-primary text-xs">${item.totalRevenue.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>

                    {/* Desktop columns */}
                    <div className="hidden md:block">
                      <p className="font-sans font-semibold text-sm text-on-surface">{item.product.name}</p>
                      <div className="mt-1 h-1 rounded-full bg-[#2A2A2A] overflow-hidden w-full">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="hidden md:block">
                      <span className="inline-block bg-[#2A2A2A] text-on-surface-variant font-label-caps text-[10px] px-2 py-1 rounded">
                        {item.product.category.name}
                      </span>
                    </div>

                    <div className="hidden md:block text-right font-sans font-bold text-on-surface">
                      {item.totalUnits.toLocaleString("es-MX")}
                      <span className="text-xs font-normal text-on-surface-variant ml-1">uds</span>
                    </div>

                    <div className="hidden md:block text-right text-primary font-sans">
                      ${item.totalRevenue.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
