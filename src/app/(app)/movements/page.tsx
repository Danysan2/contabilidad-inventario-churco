"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

type SaleItem = { product: { name: string; image: string | null }; quantity: number; unitPrice: number };
type Sale = {
  id: string;
  total: number;
  note: string | null;
  createdAt: string;
  syncedToSheets: boolean;
  employee: { id: string; name: string };
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface-container border border-outline-variant rounded-xl w-full max-w-md animate-slide-up shadow-2xl max-h-[85vh] flex flex-col">
        <div className="p-lg border-b border-outline-variant flex items-center justify-between">
          <div>
            <h3 className="font-serif text-headline-sm text-on-surface">Detalle de Venta</h3>
            <p className="text-xs text-on-surface-variant font-sans mt-0.5">
              {new Date(sale.createdAt).toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" })}
            </p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-lg overflow-y-auto flex-1">
          {/* Employee */}
          <div className="flex items-center gap-sm mb-lg pb-lg border-b border-outline-variant">
            <span className="material-symbols-outlined text-on-surface-variant icon-fill">person</span>
            <div>
              <div className="text-on-surface font-sans text-sm font-semibold">{sale.employee.name}</div>
              <div className="text-on-surface-variant text-xs">Empleado registrador</div>
            </div>
            {sale.syncedToSheets && (
              <div className="ml-auto flex items-center gap-1 text-xs text-green-400">
                <span className="material-symbols-outlined text-[14px]">sync</span>
                Sheets
              </div>
            )}
          </div>

          {/* Items */}
          <div className="flex flex-col gap-sm mb-lg">
            {sale.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-outline-variant last:border-0">
                <div>
                  <div className="text-on-surface font-sans text-sm">{item.product.name}</div>
                  <div className="text-on-surface-variant text-xs">
                    {item.quantity} × ${Number(item.unitPrice).toLocaleString("es-MX")}
                  </div>
                </div>
                <span className="text-primary font-bold font-sans text-sm">
                  ${(item.quantity * Number(item.unitPrice)).toLocaleString("es-MX")}
                </span>
              </div>
            ))}
          </div>

          {sale.note && (
            <div className="bg-surface-container-high border border-outline-variant rounded px-3 py-2 mb-lg">
              <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">NOTA</span>
              <span className="font-sans text-sm text-on-surface">{sale.note}</span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center pt-2">
            <span className="font-label-caps text-label-caps text-on-surface-variant">TOTAL</span>
            <span className="font-serif text-2xl text-primary font-bold">${Number(sale.total).toLocaleString("es-MX")}</span>
          </div>
        </div>

        {isAdmin && (
          <div className="p-lg border-t border-outline-variant">
            {confirmDelete ? (
              <div className="flex gap-sm">
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 bg-surface-container-high border border-outline-variant text-on-surface py-2 rounded font-label-caps text-label-caps text-xs">
                  Cancelar
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 bg-error-container text-on-error-container py-2 rounded font-label-caps text-label-caps text-xs flex items-center justify-center gap-1 disabled:opacity-50">
                  {deleting ? <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-[14px]">delete</span>}
                  Confirmar eliminación
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 text-error border border-error/30 hover:bg-error-container/20 py-2 rounded font-label-caps text-label-caps transition-colors">
                <span className="material-symbols-outlined text-[16px]">delete</span>
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const limit = 20;

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const res = await fetch(`/api/sales?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, dateFrom, dateTo]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

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
          <h2 className="font-serif text-headline-md text-on-surface mb-xs">Movimientos</h2>
          <p className="text-on-surface-variant font-sans text-sm">
            Historial de ventas registradas.
          </p>
        </div>
        {/* Summary chips */}
        {!loading && (
          <div className="flex items-center gap-sm">
            <div className="bg-surface-container border border-outline-variant rounded-lg px-4 py-2 text-center">
              <div className="font-label-caps text-label-caps text-on-surface-variant">VENTAS</div>
              <div className="font-serif text-xl text-on-surface font-bold">{total}</div>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-lg px-4 py-2 text-center">
              <div className="font-label-caps text-label-caps text-on-surface-variant">TOTAL MOSTRADO</div>
              <div className="font-serif text-xl text-primary font-bold">${totalRevenue.toLocaleString("es-MX")}</div>
            </div>
          </div>
        )}
      </div>

      {/* Date filters */}
      <div className="flex flex-col sm:flex-row gap-sm mb-lg">
        <div className="flex flex-col gap-1">
          <label className="font-label-caps text-label-caps text-on-surface-variant">DESDE</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-surface-container text-on-surface px-4 py-2 rounded border border-outline-variant focus:border-primary outline-none font-sans text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-label-caps text-label-caps text-on-surface-variant">HASTA</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="bg-surface-container text-on-surface px-4 py-2 rounded border border-outline-variant focus:border-primary outline-none font-sans text-sm"
          />
        </div>
        {(dateFrom || dateTo) && (
          <div className="flex items-end">
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
              className="px-4 py-2 text-on-surface-variant hover:text-on-surface border border-outline-variant rounded font-label-caps text-label-caps transition-colors"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Sales list */}
      <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg overflow-hidden">
        {/* Table header (desktop) */}
        <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_1fr_80px] gap-md p-md border-b border-[#2A2A2A] bg-surface-container-lowest font-label-caps text-label-caps text-on-surface-variant">
          <div>Fecha y Hora</div>
          <div>Productos</div>
          <div>{isAdmin ? "Empleado" : "Nota"}</div>
          <div className="text-right">Total</div>
          <div className="text-right">Estado</div>
        </div>

        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="p-md border-b border-[#2A2A2A] animate-pulse">
              <div className="h-8 bg-[#2A2A2A] rounded w-full" />
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
              className="w-full grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr_1fr_80px] gap-y-1 gap-x-md p-md border-b border-[#2A2A2A] items-center hover:bg-surface-container transition-colors text-left group"
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
                <span className="md:hidden text-on-surface-variant text-xs font-label-caps">TOTAL:</span>
                <span className="text-primary font-serif font-bold">${Number(sale.total).toLocaleString("es-MX")}</span>
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
            className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded text-on-surface-variant hover:text-on-surface disabled:opacity-30 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span className="font-sans text-sm text-on-surface-variant">
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded text-on-surface-variant hover:text-on-surface disabled:opacity-30 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
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
