"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ComposedChart, Line, Area,
  Legend,
} from "recharts";

type DashboardData = {
  totalRevenue: number;
  totalSales: number;
  revenueChange: number;
  salesChange: number;
  avgTicket: number;
  grossMargin: number;
  grossMarginPct: number;
  netMargin: number;
  netMarginPct: number;
  salesByGroup: { name: string; revenue: number }[];
  lowStockProducts: { id: string; name: string; stock: number; minStock: number; category: { name: string } }[];
  topProducts: { productId: string; name: string; quantity: number }[];
  recentSales: {
    id: string;
    total: number;
    createdAt: string;
    employee: { name: string };
    branch?: { name: string };
    items: { product: { name: string }; quantity: number }[];
  }[];
  dailyTotals: { date: string; total: number }[];
  dailyExpenses: { date: string; total: number }[];
  branchRevenue: { branchId: string; name: string; revenue: number }[];
  salesByEmployee: { name: string; revenue: number; count: number }[];
};

type Period = "day" | "week" | "month";
type Branch = { id: string; name: string; slug: string };

function MetricCard({ label, value, change, icon, prefix = "" }: {
  label: string; value: number; change: number; icon: string; prefix?: string;
}) {
  const positive = change >= 0;
  return (
    <div className="card-premium rounded-xl p-lg flex flex-col gap-sm animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "rgba(212,175,55,0.6)" }}>
          {label}
        </span>
        <span className="material-symbols-outlined icon-fill" style={{ color: "var(--gold)", fontSize: 20, opacity: 0.7 }}>{icon}</span>
      </div>
      <div className="font-display text-3xl font-bold" style={{ color: "#eae1d4" }}>
        {prefix}{typeof value === "number" ? value.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : value}
      </div>
      <div className={`flex items-center gap-1 text-xs font-sans ${positive ? "text-green-400" : "text-red-400"}`}>
        <span className="material-symbols-outlined icon-xs">{positive ? "trending_up" : "trending_down"}</span>
        <span>{Math.abs(change).toFixed(1)}% vs período anterior</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-lg shadow-xl" style={{ background: "var(--surface-2)", border: "1px solid rgba(212,175,55,0.2)" }}>
        <p className="font-sans text-[10px] uppercase tracking-wider mb-1" style={{ color: "rgba(212,175,55,0.6)" }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-display font-bold text-sm" style={{ color: p.color }}>
            {p.name}: ${Number(p.value).toLocaleString("es-MX")}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState<Period>("week");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (branchFilter !== "all") params.set("branchId", branchFilter);
      const res = await fetch(`/api/dashboard?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [period, branchFilter]);

  useEffect(() => {
    if (!isAdmin) { router.push("/pos"); return; }
    fetchData();
    fetch("/api/branches").then((r) => r.json()).then(setBranches).catch(() => {});
  }, [isAdmin, router, fetchData]);

  if (!isAdmin) return null;

  // Merge daily totals + expenses into one chart dataset
  const expenseMap = new Map((data?.dailyExpenses ?? []).map((d) => {
    const key = period === "day"
      ? new Date(d.date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
      : new Date(d.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
    return [key, Number(d.total)];
  }));

  const chartData = (data?.dailyTotals ?? []).map((d) => {
    const label = period === "day"
      ? new Date(d.date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
      : new Date(d.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
    return { date: label, ingresos: Number(d.total), egresos: expenseMap.get(label) ?? 0 };
  });

  const chartTitle = period === "day" ? "Ingresos de Hoy" : period === "week" ? "Ingresos Semanales" : "Ingresos del Mes";

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
        <div>
          <h2 className="font-display text-4xl font-bold" style={{ color: "#eae1d4" }}>Dashboard</h2>
          <p className="font-sans text-sm mt-1" style={{ color: "rgba(234,225,212,0.45)" }}>
            Resumen financiero y métricas de la barbería.
          </p>
        </div>
        <div className="flex items-center gap-sm flex-wrap">
          {/* Branch selector */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 rounded font-sans text-sm outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid rgba(212,175,55,0.15)", color: "#eae1d4" }}
          >
            <option value="all">Todas las sucursales</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Period selector */}
          <div
            className="flex items-center gap-1 p-1 rounded-lg"
            style={{ background: "var(--surface-2)", border: "1px solid rgba(212,175,55,0.1)" }}
          >
            {(["day", "week", "month"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-4 py-2 rounded font-sans text-xs font-bold uppercase tracking-wider transition-all"
                style={
                  period === p
                    ? { background: "var(--gold)", color: "#1a0800" }
                    : { color: "rgba(234,225,212,0.45)" }
                }
              >
                {p === "day" ? "Hoy" : p === "week" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container border border-outline-variant rounded-xl p-lg h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Metric cards row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-md">
            <MetricCard label="INGRESOS TOTALES" value={data?.totalRevenue ?? 0} change={data?.revenueChange ?? 0} icon="payments" prefix="$" />
            <MetricCard label="VENTAS REALIZADAS" value={data?.totalSales ?? 0} change={data?.salesChange ?? 0} icon="receipt" />
            <MetricCard label="TICKET PROMEDIO" value={data?.avgTicket ?? 0} change={0} icon="local_offer" prefix="$" />
          </div>

          {/* Margin cards row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-xl">
            <div className="card-premium rounded-xl p-lg flex flex-col gap-sm animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "rgba(212,175,55,0.6)" }}>MARGEN BRUTO</span>
                <span className="material-symbols-outlined icon-fill" style={{ color: "var(--gold)", fontSize: 20, opacity: 0.7 }}>show_chart</span>
              </div>
              <div className="font-display text-3xl font-bold" style={{ color: "#eae1d4" }}>
                ${(data?.grossMargin ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(212,175,55,0.15)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(data?.grossMarginPct ?? 0, 100)}%`, background: "var(--gold)" }} />
                </div>
                <span className="font-sans text-xs font-bold" style={{ color: "var(--gold-light)" }}>{(data?.grossMarginPct ?? 0).toFixed(1)}%</span>
              </div>
            </div>
            <div className="card-premium rounded-xl p-lg flex flex-col gap-sm animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "rgba(212,175,55,0.6)" }}>MARGEN NETO</span>
                <span className="material-symbols-outlined icon-fill" style={{ color: "var(--gold)", fontSize: 20, opacity: 0.7 }}>account_balance</span>
              </div>
              <div className="font-display text-3xl font-bold" style={{ color: (data?.netMargin ?? 0) >= 0 ? "#eae1d4" : "#f87171" }}>
                ${(data?.netMargin ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(212,175,55,0.15)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(Math.max(data?.netMarginPct ?? 0, 0), 100)}%`, background: (data?.netMargin ?? 0) >= 0 ? "var(--gold)" : "#f87171" }} />
                </div>
                <span className="font-sans text-xs font-bold" style={{ color: (data?.netMargin ?? 0) >= 0 ? "var(--gold-light)" : "#f87171" }}>{(data?.netMarginPct ?? 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-md mb-md">
            {/* Category revenue bar chart */}
            <div className="card-premium rounded-xl p-lg">
              <h3 className="font-display text-xl font-semibold mb-lg" style={{ color: "#eae1d4" }}>Por Categoría</h3>
              {data?.salesByGroup?.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.salesByGroup} layout="vertical">
                    <XAxis type="number" tick={{ fill: "#d0c5af", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#d0c5af", fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                      <div className="px-3 py-2 rounded-lg shadow-xl" style={{ background: "var(--surface-2)", border: "1px solid rgba(212,175,55,0.2)" }}>
                        <p className="font-display font-bold" style={{ color: "var(--gold-light)" }}>${Number(payload[0].value).toLocaleString("es-MX")}</p>
                      </div>
                    ) : null} />
                    <Bar dataKey="revenue" fill="#fc5500" radius={3} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-on-surface-variant font-sans text-sm">Sin datos</div>
              )}
            </div>

            {/* Main chart: ingresos + egresos combined */}
            <div className="lg:col-span-2 card-premium rounded-xl p-lg">
              <h3 className="font-display text-xl font-semibold mb-lg" style={{ color: "#eae1d4" }}>{chartTitle}</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="ingresosGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fc5500" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#fc5500" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3d1a0a" />
                    <XAxis dataKey="date" tick={{ fill: "#d0c5af", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#d0c5af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#d0c5af" }} />
                    <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#fc5500" strokeWidth={2} fill="url(#ingresosGrad)" />
                    <Line type="monotone" dataKey="egresos" name="Egresos" stroke="#8b3a00" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-on-surface-variant font-sans text-sm">
                  Sin datos para este período
                </div>
              )}
            </div>
          </div>

          {/* Branch revenue chart */}
          <div className="card-premium rounded-xl p-lg mb-xl">
            <h3 className="font-display text-xl font-semibold mb-lg" style={{ color: "#eae1d4" }}>Ingresos por Sucursal</h3>
            {data?.branchRevenue?.length ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.branchRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3d1a0a" />
                  <XAxis dataKey="name" tick={{ fill: "#d0c5af", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#d0c5af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="px-3 py-2 rounded-lg shadow-xl" style={{ background: "var(--surface-2)", border: "1px solid rgba(252,85,0,0.2)" }}>
                      <p className="font-sans text-xs mb-1" style={{ color: "rgba(234,225,212,0.5)" }}>{(payload[0].payload as { name: string }).name}</p>
                      <p className="font-display font-bold" style={{ color: "#fc5500" }}>${Number(payload[0].value).toLocaleString("es-MX")}</p>
                    </div>
                  ) : null} />
                  <Bar dataKey="revenue" name="Ingresos" radius={4}>
                    {data.branchRevenue.map((_, index) => (
                      <Cell key={index} fill={index === 0 ? "#fc5500" : "#ff7733"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-on-surface-variant font-sans text-sm">Sin datos de sucursales</div>
            )}
          </div>

          {/* Low stock, top products & ventas por barbero */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-md mb-md">
            {/* Low stock alert */}
            <div className="card-premium rounded-xl p-lg">
              <div className="flex items-center gap-sm mb-lg">
                <span className="material-symbols-outlined text-error icon-fill">warning</span>
                <h3 className="font-serif text-headline-sm text-on-surface">Stock Bajo</h3>
              </div>
              {data?.lowStockProducts.length ? (
                <ul className="flex flex-col gap-sm">
                  {data.lowStockProducts.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
                      <div>
                        <div className="text-on-surface font-sans text-sm font-semibold">{p.name}</div>
                        <div className="text-on-surface-variant text-xs">{p.category.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-error font-bold font-sans">{p.stock}</span>
                        <span className="text-on-surface-variant text-xs">/ min {p.minStock}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center h-24 text-on-surface-variant">
                  <span className="material-symbols-outlined text-2xl mb-1">check_circle</span>
                  <span className="text-sm font-sans">Todo el stock está en nivel óptimo</span>
                </div>
              )}
            </div>

            {/* Top products */}
            <div className="card-premium rounded-xl p-lg">
              <h3 className="font-display text-xl font-semibold mb-lg" style={{ color: "#eae1d4" }}>Más Vendidos</h3>
              {data?.topProducts.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.topProducts} layout="vertical">
                    <XAxis type="number" tick={{ fill: "#d0c5af", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#d0c5af", fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                      <div className="px-2 py-1 rounded text-xs" style={{ background: "var(--surface-2)", border: "1px solid rgba(212,175,55,0.2)", color: "var(--gold-light)" }}>
                        {payload[0].value} unidades
                      </div>
                    ) : null} />
                    <Bar dataKey="quantity" fill="#fc5500" radius={2} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-on-surface-variant font-sans text-sm">Sin ventas registradas</div>
              )}
            </div>

            {/* Ventas por barbero */}
            <div className="card-premium rounded-xl p-lg">
              <h3 className="font-display text-xl font-semibold mb-lg" style={{ color: "#eae1d4" }}>Ventas por Barbero</h3>
              {data?.salesByEmployee?.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.salesByEmployee} layout="vertical">
                    <XAxis type="number" tick={{ fill: "#d0c5af", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#d0c5af", fontSize: 10 }} axisLine={false} tickLine={false} width={72} />
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                      <div className="px-2 py-1 rounded text-xs" style={{ background: "var(--surface-2)", border: "1px solid rgba(252,85,0,0.2)", color: "var(--gold-light)" }}>
                        ${Number(payload[0].value).toLocaleString("es-MX")} · {(payload[0].payload as { count: number }).count} ventas
                      </div>
                    ) : null} />
                    <Bar dataKey="revenue" fill="#fc5500" radius={2} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-on-surface-variant font-sans text-sm">Sin ventas registradas</div>
              )}
            </div>
          </div>

          {/* Recent sales */}
          <div className="card-premium rounded-xl p-lg">
            <h3 className="font-display text-xl font-semibold mb-lg" style={{ color: "#eae1d4" }}>Ventas Recientes</h3>
            {data?.recentSales.length ? (
              <ul className="flex flex-col gap-sm">
                {data.recentSales.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
                    <div>
                      <div className="text-on-surface font-sans text-sm font-semibold">
                        {s.items.map((i) => `${i.product.name} x${i.quantity}`).join(", ").slice(0, 40)}
                        {s.items.reduce((a, b) => a + b.quantity, 0) > 2 ? "..." : ""}
                      </div>
                      <div className="text-on-surface-variant text-xs">
                        {s.employee.name}
                        {s.branch ? ` · ${s.branch.name}` : ""}
                        {" · "}{new Date(s.createdAt).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <span className="text-primary font-serif font-bold">
                      ${Number(s.total).toLocaleString("es-MX")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-24 text-on-surface-variant text-sm font-sans">
                Sin ventas en este período
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
