"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Branch = { id: string; name: string; slug: string };
type Product = { id: string; name: string; sku: string; price: number; costPrice: number | null };
type PurchaseItem = { product: { id: string; name: string; sku: string }; quantity: number; unitCost: number };
type Purchase = { id: string; date: string; note: string | null; items: PurchaseItem[] };
type FixedExpense = { id: string; name: string; amount: number; categorySlug: string | null; description: string | null; active: boolean };

type DraftItem = { productId: string; quantity: string; unitCost: string };

function PurchaseModal({ products, onSave, onClose, defaultBranchId, branches }: {
  products: Product[];
  onSave: () => void;
  onClose: () => void;
  defaultBranchId: string;
  branches: Branch[];
}) {
  const [note, setNote] = useState("");
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [items, setItems] = useState<DraftItem[]>([{ productId: "", quantity: "", unitCost: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addRow = () => setItems((prev) => [...prev, { productId: "", quantity: "", unitCost: "" }]);
  const removeRow = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof DraftItem, value: string) =>
    setItems((prev) => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const parseRow = (row: DraftItem) => ({
    productId: row.productId,
    quantity: parseInt(row.quantity) || 0,
    unitCost: parseFloat(row.unitCost) || 0,
  });

  const total = items.reduce((s, i) => {
    const qty = parseInt(i.quantity) || 0;
    const cost = parseFloat(i.unitCost) || 0;
    return s + qty * cost;
  }, 0);

  async function handleSave() {
    const valid = items.map(parseRow).filter((i) => i.productId && i.quantity > 0 && i.unitCost > 0);
    if (!valid.length) { setError("Agrega al menos un producto con cantidad y costo."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/egresos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note || undefined, items: valid, branchId }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Error al guardar"); }
      onSave();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const labelStyle = { color: "rgba(252,85,0,0.6)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 pb-24 md:pb-4">
      <div className="card-premium rounded-xl w-full max-w-2xl animate-slide-up shadow-2xl max-h-[90vh] flex flex-col">
        <div className="p-lg flex items-center justify-between" style={{ borderBottom: "1px solid rgba(252,85,0,0.1)" }}>
          <h3 className="font-display text-xl font-semibold" style={{ color: "#eae1d4" }}>Registrar Compra</h3>
          <button onClick={onClose} style={{ color: "rgba(234,225,212,0.4)" }}><span className="material-symbols-outlined">close</span></button>
        </div>

        <div className="p-lg overflow-y-auto flex-1 flex flex-col gap-md">
          {/* Branch */}
          <div className="flex flex-col gap-1">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>Sucursal</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="input-premium"
              style={{ background: "var(--surface-2)", color: "#eae1d4", colorScheme: "dark" }}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} style={{ background: "#1a1610", color: "#eae1d4" }}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>Nota (opcional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: Pedido semanal proveedor X" className="input-premium" />
          </div>

          {/* Items */}
          <div>
            <div className="hidden md:grid grid-cols-[2fr_80px_120px_80px_36px] gap-sm mb-2 font-sans text-[10px] font-bold uppercase tracking-wider" style={labelStyle}>
              <span>Producto</span><span>Cantidad</span><span>Costo unitario</span><span className="text-right">Total</span><span />
            </div>
            <div className="flex flex-col gap-sm">
              {items.map((row, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[2fr_80px_120px_80px_36px] gap-sm items-center"
                  style={{ paddingBottom: 8, borderBottom: "1px solid rgba(252,85,0,0.06)" }}>
                  <select
                    value={row.productId}
                    onChange={(e) => {
                      const prod = products.find((p) => p.id === e.target.value);
                      updateRow(i, "productId", e.target.value);
                      if (prod?.costPrice) updateRow(i, "unitCost", String(prod.costPrice));
                    }}
                    className="input-premium"
                    style={{
                      background: "var(--surface-2)",
                      color: row.productId ? "#eae1d4" : "rgba(234,225,212,0.4)",
                      colorScheme: "dark",
                    }}
                  >
                    <option value="" style={{ background: "#1a1610", color: "rgba(234,225,212,0.4)" }}>— Selecciona producto —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} style={{ background: "#1a1610", color: "#eae1d4" }}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) => updateRow(i, "quantity", e.target.value)}
                    placeholder="Cant."
                    className="input-premium text-right"
                  />
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={row.unitCost}
                    onChange={(e) => updateRow(i, "unitCost", e.target.value)}
                    placeholder="$ costo"
                    className="input-premium text-right"
                  />
                  <div className="font-display font-bold text-right" style={{ color: "var(--gold-light)" }}>
                    ${((parseInt(row.quantity) || 0) * (parseFloat(row.unitCost) || 0)).toLocaleString("es-CO")}
                  </div>
                  <button onClick={() => removeRow(i)} disabled={items.length === 1}
                    className="w-8 h-8 flex items-center justify-center rounded transition-colors disabled:opacity-20"
                    style={{ color: "#f87171" }}>
                    <span className="material-symbols-outlined icon-sm">remove_circle</span>
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addRow} className="mt-3 flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-wider transition-colors"
              style={{ color: "rgba(252,85,0,0.7)" }}>
              <span className="material-symbols-outlined icon-sm">add_circle</span>
              Agregar producto
            </button>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-2" style={{ borderTop: "1px solid rgba(252,85,0,0.1)" }}>
            <span className="font-sans text-[10px] uppercase tracking-widest" style={labelStyle}>Total compra</span>
            <span className="font-display text-2xl font-bold text-gold-gradient">${total.toLocaleString("es-CO")}</span>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded text-sm" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#f87171" }}>
              <span className="material-symbols-outlined icon-sm">error</span>{error}
            </div>
          )}
        </div>

        <div className="p-lg flex gap-sm" style={{ borderTop: "1px solid rgba(252,85,0,0.1)" }}>
          <button onClick={onClose} className="flex-1 py-3 rounded font-sans text-xs font-bold uppercase tracking-wider"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(252,85,0,0.1)", color: "rgba(234,225,212,0.5)" }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="btn-gold flex-grow py-3 rounded flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <span className="material-symbols-outlined icon-sm animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined icon-sm">save</span>}
            Registrar
          </button>
        </div>
      </div>
    </div>
  );
}

function FixedExpenseModal({ expense, onSave, onClose, branches, defaultBranchId }: {
  expense?: Partial<FixedExpense & { branchId?: string }>;
  onSave: () => void;
  onClose: () => void;
  branches: Branch[];
  defaultBranchId: string;
}) {
  const [name, setName] = useState(expense?.name ?? "");
  const [amount, setAmount] = useState(expense?.amount ? String(expense.amount) : "");
  const [categorySlug, setCategorySlug] = useState(expense?.categorySlug ?? "");
  const [description, setDescription] = useState(expense?.description ?? "");
  const [branchId, setBranchId] = useState(expense?.branchId ?? defaultBranchId);
  const [saving, setSaving] = useState(false);

  const labelStyle = { color: "rgba(252,85,0,0.6)" };

  async function handleSave() {
    setSaving(true);
    try {
      const url = expense?.id ? `/api/gastos-fijos/${expense.id}` : "/api/gastos-fijos";
      const method = expense?.id ? "PUT" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, amount: parseFloat(amount) || 0, categorySlug, description, branchId }) });
      onSave(); onClose();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card-premium rounded-xl w-full max-w-sm animate-scale-in shadow-2xl">
        <div className="p-lg flex items-center justify-between" style={{ borderBottom: "1px solid rgba(252,85,0,0.1)" }}>
          <h3 className="font-display text-lg font-semibold" style={{ color: "#eae1d4" }}>{expense?.id ? "Editar" : "Nuevo"} Gasto Fijo</h3>
          <button onClick={onClose} style={{ color: "rgba(234,225,212,0.4)" }}><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="p-lg flex flex-col gap-md">
          <div className="flex flex-col gap-1">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>Nombre *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Electricidad neveras" className="input-premium" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>Monto mensual (COP) *</label>
            <input type="number" min={0} step={1000} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ej: 80000" className="input-premium" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>Categoría relacionada</label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="input-premium"
              style={{ background: "var(--surface-2)", color: "#eae1d4", colorScheme: "dark" }}
            >
              <option value="" style={{ background: "#1a1610", color: "#eae1d4" }}>— General —</option>
              <option value="bebidas" style={{ background: "#1a1610", color: "#eae1d4" }}>Bebidas</option>
              <option value="belleza" style={{ background: "#1a1610", color: "#eae1d4" }}>Belleza</option>
              <option value="comida" style={{ background: "#1a1610", color: "#eae1d4" }}>Comida</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>Sucursal</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="input-premium"
              style={{ background: "var(--surface-2)", color: "#eae1d4", colorScheme: "dark" }}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} style={{ background: "#1a1610", color: "#eae1d4" }}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>Descripción</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" className="input-premium" />
          </div>
        </div>
        <div className="p-lg flex gap-sm" style={{ borderTop: "1px solid rgba(252,85,0,0.1)" }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded font-sans text-xs font-bold uppercase tracking-wider"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(252,85,0,0.1)", color: "rgba(234,225,212,0.5)" }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !name || !(parseFloat(amount) > 0)}
            className="btn-gold flex-1 py-2.5 rounded flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <span className="material-symbols-outlined icon-sm animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined icon-sm">save</span>}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EgresosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "ADMIN";

  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"compras" | "gastos">("compras");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [editExpense, setEditExpense] = useState<Partial<FixedExpense> | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) { router.push("/pos"); return; }
  }, [isAdmin, router]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, purchRes, fxRes, branchRes] = await Promise.all([
        fetch("/api/products?active=false"),
        fetch("/api/egresos"),
        fetch("/api/gastos-fijos"),
        fetch("/api/branches"),
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (purchRes.ok) { const d = await purchRes.json(); setPurchases(d.purchases); }
      if (fxRes.ok) setFixedExpenses(await fxRes.json());
      if (branchRes.ok) setBranches(await branchRes.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAdmin) fetchAll(); }, [isAdmin, fetchAll]);

  async function handleDeleteExpense(id: string) {
    await fetch(`/api/gastos-fijos/${id}`, { method: "DELETE" });
    setDeleteExpenseId(null);
    fetchAll();
  }

  async function handleDeletePurchase(id: string) {
    await fetch(`/api/egresos/${id}`, { method: "DELETE" });
    fetchAll();
  }

  if (!isAdmin) return null;

  const totalMonthlyFixed = fixedExpenses.filter((e) => e.active).reduce((s, e) => s + Number(e.amount), 0);
  const totalPurchases = purchases.reduce((s, p) => s + p.items.reduce((si, i) => si + i.quantity * Number(i.unitCost), 0), 0);

  const tabStyle = (active: boolean) => ({
    color: active ? "var(--gold-light)" : "rgba(234,225,212,0.4)",
    borderBottom: active ? "2px solid var(--gold)" : "2px solid transparent",
    paddingBottom: 8,
  });

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
        <div>
          <h2 className="font-display text-4xl font-bold" style={{ color: "#eae1d4" }}>Egresos</h2>
          <p className="font-sans text-sm mt-1" style={{ color: "rgba(234,225,212,0.45)" }}>
            Registra compras de mercancía y gestiona gastos fijos mensuales.
          </p>
        </div>
        <div className="flex gap-sm">
          <button onClick={() => setShowPurchaseModal(true)} className="btn-gold px-lg py-md rounded flex items-center gap-sm">
            <span className="material-symbols-outlined icon-sm">add_shopping_cart</span>
            Registrar Compra
          </button>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-sm mb-lg">
        <div className="card-premium rounded-lg px-4 py-3 text-center flex-1">
          <div className="font-sans text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(252,85,0,0.55)" }}>Compras registradas</div>
          <div className="font-display text-xl font-bold" style={{ color: "#eae1d4" }}>{purchases.length}</div>
        </div>
        <div className="card-premium rounded-lg px-4 py-3 text-center flex-1">
          <div className="font-sans text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(252,85,0,0.55)" }}>Total invertido</div>
          <div className="font-display text-xl font-bold text-gold-gradient">${totalPurchases.toLocaleString("es-CO")}</div>
        </div>
        <div className="card-premium rounded-lg px-4 py-3 text-center flex-1">
          <div className="font-sans text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(252,85,0,0.55)" }}>Gastos fijos / mes</div>
          <div className="font-display text-xl font-bold" style={{ color: "#eae1d4" }}>${totalMonthlyFixed.toLocaleString("es-CO")}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-lg mb-lg" style={{ borderBottom: "1px solid rgba(252,85,0,0.08)" }}>
        {[["compras", "Historial de Compras"], ["gastos", "Gastos Fijos"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as "compras" | "gastos")}
            className="font-sans text-sm font-bold uppercase tracking-wider pb-2 transition-colors"
            style={tabStyle(tab === key)}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Compras tab ── */}
      {tab === "compras" && (
        <div className="card-premium rounded-lg overflow-hidden">
          <div className="hidden md:grid grid-cols-[140px_1fr_1fr_120px_60px] gap-md p-md font-sans text-[10px] font-bold uppercase tracking-wider"
            style={{ borderBottom: "1px solid rgba(252,85,0,0.08)", color: "rgba(252,85,0,0.5)" }}>
            <span>Fecha</span><span>Productos</span><span>Nota</span><span className="text-right">Total</span><span />
          </div>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="p-md animate-pulse" style={{ borderBottom: "1px solid rgba(252,85,0,0.06)" }}>
                <div className="h-8 rounded" style={{ background: "var(--surface-3)" }} />
              </div>
            ))
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: "rgba(234,225,212,0.35)" }}>
              <span className="material-symbols-outlined text-4xl mb-2">add_shopping_cart</span>
              <span className="font-sans text-sm">Sin compras registradas</span>
            </div>
          ) : (
            purchases.map((p) => {
              const total = p.items.reduce((s, i) => s + i.quantity * Number(i.unitCost), 0);
              return (
                <div key={p.id} className="grid grid-cols-1 md:grid-cols-[140px_1fr_1fr_120px_60px] gap-sm p-md items-start transition-colors"
                  style={{ borderBottom: "1px solid rgba(252,85,0,0.06)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(252,85,0,0.03)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <div className="font-sans text-xs" style={{ color: "rgba(234,225,212,0.5)" }}>
                    {new Date(p.date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <div className="font-sans text-sm" style={{ color: "#eae1d4" }}>
                    {p.items.map((i) => `${i.product.name} ×${i.quantity}`).join(", ")}
                  </div>
                  <div className="font-sans text-xs" style={{ color: "rgba(234,225,212,0.4)" }}>{p.note ?? "—"}</div>
                  <div className="font-display font-bold text-right" style={{ color: "var(--gold-light)" }}>
                    ${total.toLocaleString("es-CO")}
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => handleDeletePurchase(p.id)}
                      className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                      style={{ color: "rgba(234,225,212,0.3)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f87171")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(234,225,212,0.3)")}
                      title="Eliminar">
                      <span className="material-symbols-outlined icon-sm">delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Gastos Fijos tab ── */}
      {tab === "gastos" && (
        <div>
          <div className="flex justify-end mb-md">
            <button onClick={() => setEditExpense({})} className="btn-gold py-2.5 px-5 rounded flex items-center gap-2">
              <span className="material-symbols-outlined icon-sm">add</span>
              Nuevo gasto fijo
            </button>
          </div>

          <div className="card-premium rounded-lg overflow-hidden">
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_80px] gap-md p-md font-sans text-[10px] font-bold uppercase tracking-wider"
              style={{ borderBottom: "1px solid rgba(252,85,0,0.08)", color: "rgba(252,85,0,0.5)" }}>
              <span>Nombre</span><span>Categoría</span><span className="text-right">Monto/mes</span><span />
            </div>

            {fixedExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16" style={{ color: "rgba(234,225,212,0.35)" }}>
                <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
                <span className="font-sans text-sm">Sin gastos fijos registrados</span>
              </div>
            ) : (
              fixedExpenses.map((e) => (
                <div key={e.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_80px] gap-sm p-md items-center transition-colors"
                  style={{ borderBottom: "1px solid rgba(252,85,0,0.06)", opacity: e.active ? 1 : 0.4 }}
                  onMouseEnter={(el) => ((el.currentTarget as HTMLElement).style.background = "rgba(252,85,0,0.03)")}
                  onMouseLeave={(el) => ((el.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <div>
                    <div className="font-sans text-sm font-semibold" style={{ color: "#eae1d4" }}>{e.name}</div>
                    {e.description && <div className="font-sans text-xs" style={{ color: "rgba(234,225,212,0.4)" }}>{e.description}</div>}
                  </div>
                  <div>
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ background: "rgba(252,85,0,0.08)", color: "rgba(252,85,0,0.6)" }}>
                      {e.categorySlug ?? "General"}
                    </span>
                  </div>
                  <div className="font-display font-bold text-right" style={{ color: "var(--gold-light)" }}>
                    ${Number(e.amount).toLocaleString("es-CO")}
                  </div>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditExpense(e)}
                      className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                      style={{ color: "rgba(234,225,212,0.35)" }}
                      onMouseEnter={(el) => ((el.currentTarget as HTMLElement).style.color = "var(--gold-light)")}
                      onMouseLeave={(el) => ((el.currentTarget as HTMLElement).style.color = "rgba(234,225,212,0.35)")}
                    >
                      <span className="material-symbols-outlined icon-sm">edit</span>
                    </button>
                    <button onClick={() => setDeleteExpenseId(e.id)}
                      className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                      style={{ color: "rgba(234,225,212,0.3)" }}
                      onMouseEnter={(el) => ((el.currentTarget as HTMLElement).style.color = "#f87171")}
                      onMouseLeave={(el) => ((el.currentTarget as HTMLElement).style.color = "rgba(234,225,212,0.3)")}
                    >
                      <span className="material-symbols-outlined icon-sm">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}

            {fixedExpenses.length > 0 && (
              <div className="flex justify-between items-center p-md" style={{ borderTop: "1px solid rgba(252,85,0,0.1)" }}>
                <span className="font-sans text-[10px] uppercase tracking-widest" style={{ color: "rgba(252,85,0,0.6)" }}>Total mensual</span>
                <span className="font-display text-xl font-bold text-gold-gradient">${totalMonthlyFixed.toLocaleString("es-CO")}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showPurchaseModal && (
        <PurchaseModal products={products} onSave={fetchAll} onClose={() => setShowPurchaseModal(false)} defaultBranchId={branches[0]?.id ?? ""} branches={branches} />
      )}
      {editExpense !== null && (
        <FixedExpenseModal expense={editExpense} onSave={fetchAll} onClose={() => setEditExpense(null)} branches={branches} defaultBranchId={branches[0]?.id ?? ""} />
      )}
      {deleteExpenseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card-premium rounded-xl p-lg w-full max-w-sm animate-scale-in shadow-2xl">
            <div className="flex items-center gap-sm mb-md">
              <span className="material-symbols-outlined" style={{ color: "#f87171", fontSize: 24 }}>delete_forever</span>
              <h3 className="font-display text-lg font-semibold" style={{ color: "#eae1d4" }}>¿Eliminar gasto?</h3>
            </div>
            <p className="font-sans text-sm mb-lg" style={{ color: "rgba(234,225,212,0.5)" }}>Esta acción no se puede deshacer.</p>
            <div className="flex gap-sm">
              <button onClick={() => setDeleteExpenseId(null)} className="flex-1 py-2.5 rounded font-sans text-xs font-bold uppercase tracking-wider"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(252,85,0,0.1)", color: "rgba(234,225,212,0.5)" }}>
                Cancelar
              </button>
              <button onClick={() => handleDeleteExpense(deleteExpenseId)}
                className="flex-1 py-2.5 rounded font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1"
                style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)", color: "#f87171" }}>
                <span className="material-symbols-outlined icon-xs">delete</span>Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
