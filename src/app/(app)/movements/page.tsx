"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Branch = { id: string; name: string; slug: string };
type SaleItem = { product: { name: string; image: string | null }; quantity: number; unitPrice: number };
type Sale = {
  id: string;
  total: number;
  note: string | null;
  createdAt: string;
  syncedToSheets: boolean;
  employee: { id: string; name: string };
  branch?: { id: string; name: string; slug: string };
  items: SaleItem[];
};

function SaleDetailModal({ sale, onClose, onDelete, isAdmin }: {
  sale: Sale; onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  isAdmin: boolean;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onDelete(sale.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 pb-24 md:pb-4">
      <div className="card-premium rounded-xl w-full max-w-md animate-slide-up shadow-2xl max-h-[85vh] flex flex-col">
        <div
          className="p-lg flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(252,85,0,0.1)" }}
        >
          <div>
            <h3 className="font-display text-xl font-semibold" style={{ color: "#eae1d4" }}>Detalle de Venta</h3>
            <p className="font-sans text-xs mt-0.5" style={{ color: "rgba(234,225,212,0.4)" }}>
              {new Date(sale.createdAt).toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" })}
            </p>
          </div>
          <button onClick={onClose} style={{ color: "rgba(234,225,212,0.4)" }} className="hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-lg overflow-y-auto flex-1">
          {/* Employee */}
          <div
            className="flex items-center gap-sm mb-lg pb-lg"
            style={{ borderBottom: "1px solid rgba(252,85,0,0.08)" }}
          >
            <span className="material-symbols-outlined icon-fill" style={{ color: "rgba(252,85,0,0.5)" }}>person</span>
            <div>
              <div className="font-sans text-sm font-semibold" style={{ color: "#eae1d4" }}>{sale.employee.name}</div>
              <div className="font-sans text-xs" style={{ color: "rgba(234,225,212,0.4)" }}>Empleado registrador</div>
            </div>
            {sale.syncedToSheets && (
              <div className="ml-auto flex items-center gap-1 text-xs text-green-400">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>sync</span>
                Sheets
              </div>
            )}
          </div>

          {/* Items */}
          <div className="flex flex-col gap-sm mb-lg">
            {sale.items.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center py-2"
                style={{ borderBottom: "1px solid rgba(252,85,0,0.07)" }}
              >
                <div>
                  <div className="font-sans text-sm" style={{ color: "#eae1d4" }}>{item.product.name}</div>
                  <div className="font-sans text-xs" style={{ color: "rgba(234,225,212,0.4)" }}>
                    {item.quantity} × ${Number(item.unitPrice).toLocaleString("es-MX")}
                  </div>
                </div>
                <span className="font-display font-bold" style={{ color: "var(--gold-light)" }}>
                  ${(item.quantity * Number(item.unitPrice)).toLocaleString("es-MX")}
                </span>
              </div>
            ))}
          </div>

          {sale.note && (
            <div
              className="rounded px-3 py-2 mb-lg"
              style={{ background: "rgba(252,85,0,0.05)", border: "1px solid rgba(252,85,0,0.12)" }}
            >
              <span className="font-sans text-[10px] uppercase tracking-widest block mb-1" style={{ color: "rgba(252,85,0,0.6)" }}>Nota</span>
              <span className="font-sans text-sm" style={{ color: "#eae1d4" }}>{sale.note}</span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center pt-2">
            <span className="font-sans text-[10px] uppercase tracking-widest" style={{ color: "rgba(252,85,0,0.6)" }}>Total</span>
            <span className="font-display text-2xl font-bold text-gold-gradient">${Number(sale.total).toLocaleString("es-MX")}</span>
          </div>
        </div>

        {isAdmin && (
          <div className="p-lg" style={{ borderTop: "1px solid rgba(252,85,0,0.1)" }}>
            {confirmDelete ? (
              <div className="flex gap-sm">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 rounded font-sans text-xs font-bold uppercase tracking-wider transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(252,85,0,0.1)", color: "rgba(234,225,212,0.5)" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2 rounded font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 disabled:opacity-50"
                  style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)", color: "#f87171" }}
                >
                  {deleting
                    ? <span className="material-symbols-outlined icon-xs animate-spin">progress_activity</span>
                    : <span className="material-symbols-outlined icon-xs">delete</span>
                  }
                  Confirmar eliminación
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded font-sans text-xs font-bold uppercase tracking-wider transition-colors"
                style={{ color: "#f87171", border: "1px solid rgba(220,38,38,0.2)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.06)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <span className="material-symbols-outlined icon-sm">delete</span>
                Eliminar Venta
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MovementsPage() {
  const { data: session } = useSession();
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [branches, setBranches] = useState<Branch[]>([]);
  const limit = 20;

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (dateFrom) params.set("from", dateFrom.toISOString());
      if (dateTo) params.set("to", dateTo.toISOString());
      if (isAdmin && branchFilter !== "all") params.set("branchId", branchFilter);
      const res = await fetch(`/api/sales?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, dateFrom, dateTo, isAdmin, branchFilter]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  useEffect(() => {
    if (isAdmin) fetch("/api/branches").then((r) => r.json()).then(setBranches).catch(() => {});
  }, [isAdmin]);

  async function handleDelete(id: string) {
    await fetch(`/api/sales/${id}`, { method: "DELETE" });
    fetchSales();
  }

  const totalPages = Math.ceil(total / limit);
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
        <div>
          <h2 className="font-display text-4xl font-bold" style={{ color: "#eae1d4" }}>Movimientos</h2>
          <p className="font-sans text-sm mt-1" style={{ color: "rgba(234,225,212,0.45)" }}>
            Historial de ventas registradas.
          </p>
        </div>
        {/* Summary chips */}
        {!loading && (
          <div className="flex items-center gap-sm">
            <div
              className="card-premium rounded-lg px-4 py-2 text-center"
            >
              <div className="font-sans text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(252,85,0,0.55)" }}>Ventas</div>
              <div className="font-display text-xl font-bold" style={{ color: "#eae1d4" }}>{total}</div>
            </div>
            <div className="card-premium rounded-lg px-4 py-2 text-center">
              <div className="font-sans text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(252,85,0,0.55)" }}>Total mostrado</div>
              <div className="font-display text-xl font-bold text-gold-gradient">${totalRevenue.toLocaleString("es-MX")}</div>
            </div>
          </div>
        )}
      </div>

      {/* Branch filter (admin only) */}
      {isAdmin && (
        <div className="flex items-center gap-sm mb-sm">
          <label className="font-sans text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(252,85,0,0.6)" }}>
            Sucursal
          </label>
          <select
            value={branchFilter}
            onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded font-sans text-sm outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid rgba(252,85,0,0.15)", color: "#eae1d4" }}
          >
            <option value="all">Todas las sucursales</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Date filters */}
      <div className="flex flex-col sm:flex-row gap-sm mb-lg items-end">
        {([
          { label: "Desde", value: dateFrom, onChange: (d: Date | null) => { setDateFrom(d); setPage(1); }, maxDate: dateTo ?? undefined },
          { label: "Hasta", value: dateTo, onChange: (d: Date | null) => { setDateTo(d); setPage(1); }, minDate: dateFrom ?? undefined },
        ] as const).map(({ label, value, onChange, ...rest }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(252,85,0,0.6)" }}>
              {label}
            </label>
            <DatePicker
              selected={value}
              onChange={onChange}
              dateFormat="dd/MM/yyyy"
              placeholderText="dd/mm/aaaa"
              locale="es"
              isClearable
              showPopperArrow={false}
              {...rest}
              className="px-4 py-2 rounded font-sans text-sm outline-none transition-colors datepicker-gold"
            />
          </div>
        ))}
        {(dateFrom || dateTo) && (
          <div className="flex items-end">
            <button
              onClick={() => { setDateFrom(null); setDateTo(null); setPage(1); }}
              className="px-4 py-2 rounded font-sans text-xs font-bold uppercase tracking-wider transition-colors"
              style={{
                color: "rgba(234,225,212,0.45)",
                border: "1px solid rgba(252,85,0,0.1)",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#eae1d4")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(234,225,212,0.45)")}
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Sales list */}
      <div className="card-premium rounded-lg overflow-hidden">
        {/* Table header (desktop) */}
        <div
          className="hidden md:grid grid-cols-[1fr_2fr_1fr_1fr_80px] gap-md p-md font-sans text-[10px] font-bold uppercase tracking-wider"
          style={{ borderBottom: "1px solid rgba(252,85,0,0.08)", color: "rgba(252,85,0,0.5)" }}
        >
          <div>Fecha y Hora</div>
          <div>Productos</div>
          <div>{isAdmin ? "Empleado" : "Nota"}</div>
          <div className="text-right">Total</div>
          <div className="text-right">Estado</div>
        </div>

        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="p-md animate-pulse" style={{ borderBottom: "1px solid rgba(252,85,0,0.06)" }}>
              <div className="h-8 rounded w-full" style={{ background: "var(--surface-3)" }} />
            </div>
          ))
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
            <span className="font-sans text-sm">No hay ventas registradas</span>
          </div>
        ) : (
          sales.map((sale) => (
            <button
              key={sale.id}
              onClick={() => setSelectedSale(sale)}
              className="w-full grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr_1fr_80px] gap-y-1 gap-x-md p-md items-center transition-colors text-left group"
              style={{ borderBottom: "1px solid rgba(252,85,0,0.06)" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(252,85,0,0.03)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
            >
              {/* Date */}
              <div className="text-on-surface-variant font-sans text-xs">
                {new Date(sale.createdAt).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>

              {/* Items summary */}
              <div className="text-on-surface font-sans text-sm truncate">
                {sale.items.map((i) => `${i.product.name}×${i.quantity}`).join(", ")}
              </div>

              {/* Employee / note */}
              <div className="text-on-surface-variant font-sans text-xs">
                {isAdmin ? sale.employee.name : (sale.note ?? "—")}
              </div>

              {/* Total */}
              <div className="flex justify-between md:block text-right">
                <span className="md:hidden font-sans text-[10px] uppercase tracking-wider" style={{ color: "rgba(252,85,0,0.55)" }}>Total:</span>
                <span className="font-display font-bold" style={{ color: "var(--gold-light)" }}>${Number(sale.total).toLocaleString("es-MX")}</span>
              </div>

              {/* Sync status */}
              <div className="flex justify-end">
                <span
                  className={`material-symbols-outlined text-[16px] ${sale.syncedToSheets ? "text-green-400" : "text-outline"}`}
                  title={sale.syncedToSheets ? "Sincronizado con Sheets" : "No sincronizado"}
                >
                  {sale.syncedToSheets ? "cloud_done" : "cloud_off"}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-sm mt-lg">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="w-8 h-8 flex items-center justify-center rounded transition-colors disabled:opacity-30"
            style={{ border: "1px solid rgba(252,85,0,0.15)", color: "rgba(234,225,212,0.45)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
          </button>
          <span className="font-sans text-sm" style={{ color: "rgba(234,225,212,0.45)" }}>
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="w-8 h-8 flex items-center justify-center rounded transition-colors disabled:opacity-30"
            style={{ border: "1px solid rgba(252,85,0,0.15)", color: "rgba(234,225,212,0.45)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
          </button>
        </div>
      )}

      {/* Sale detail modal */}
      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onDelete={handleDelete}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
