"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import DatePicker, { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale/es";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("es", es);

type Corte = {
  id: string;
  price: number;
  ownerPct: number;
  ownerAmount: number;
  employeeAmount: number;
  note: string | null;
  createdAt: string;
  employee: { id: string; name: string };
  branch?: { id: string; name: string } | null;
};

type Employee = { id: string; name: string; email: string };

function CorteModal({
  onSave,
  onClose,
  lastOwnerPct,
}: {
  onSave: () => void;
  onClose: () => void;
  lastOwnerPct: number;
}) {
  const [price, setPrice] = useState("");
  const [ownerPct, setOwnerPct] = useState("35");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const priceNum = parseFloat(price) || 0;
  const pctNum = parseFloat(ownerPct) || 0;
  const ownerAmount = priceNum * pctNum / 100;
  const employeeAmount = priceNum - ownerAmount;

  async function handleSave() {
    if (!priceNum || priceNum <= 0) { setError("El valor debe ser mayor a 0"); return; }
    if (pctNum < 0 || pctNum > 100) { setError("El porcentaje debe estar entre 0 y 100"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/cortes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: priceNum, ownerPct: pctNum, note: note || undefined }),
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
      <div className="card-premium rounded-xl w-full max-w-sm animate-scale-in shadow-2xl">
        <div className="p-lg flex items-center justify-between" style={{ borderBottom: "1px solid rgba(252,85,0,0.1)" }}>
          <h3 className="font-display text-lg font-semibold" style={{ color: "#eae1d4" }}>Registrar Corte</h3>
          <button onClick={onClose} style={{ color: "rgba(234,225,212,0.4)" }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-lg flex flex-col gap-md">
          <div className="flex flex-col gap-1">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>Valor del corte (COP) *</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ej: 25000"
              className="input-premium"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>% del dueño *</label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={ownerPct}
              onChange={(e) => setOwnerPct(e.target.value)}
              placeholder="Ej: 40"
              className="input-premium"
            />
          </div>

          {/* Preview */}
          {priceNum > 0 && (
            <div className="flex gap-sm">
              <div className="flex-1 rounded-lg px-3 py-2.5 text-center" style={{ background: "rgba(252,85,0,0.08)", border: "1px solid rgba(252,85,0,0.15)" }}>
                <p className="font-sans text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(252,85,0,0.55)" }}>Dueño</p>
                <p className="font-display font-bold text-lg" style={{ color: "#fc5500" }}>${ownerAmount.toLocaleString("es-CO")}</p>
              </div>
              <div className="flex-1 rounded-lg px-3 py-2.5 text-center" style={{ background: "rgba(234,225,212,0.05)", border: "1px solid rgba(234,225,212,0.08)" }}>
                <p className="font-sans text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(234,225,212,0.4)" }}>Para mí</p>
                <p className="font-display font-bold text-lg" style={{ color: "#eae1d4" }}>${employeeAmount.toLocaleString("es-CO")}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>Nota (opcional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Corte + arreglo barba"
              className="input-premium"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded text-sm font-sans" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)", color: "#f87171" }}>
              <span className="material-symbols-outlined icon-sm">error</span>
              {error}
            </div>
          )}
        </div>

        <div className="p-lg flex gap-sm" style={{ borderTop: "1px solid rgba(252,85,0,0.1)" }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded font-sans text-xs font-bold uppercase tracking-wider"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(252,85,0,0.1)", color: "rgba(234,225,212,0.5)" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !priceNum}
            className="btn-gold flex-1 py-2.5 rounded flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving
              ? <span className="material-symbols-outlined icon-sm animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined icon-sm">content_cut</span>}
            Registrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CortesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [cortes, setCortes] = useState<Corte[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<Date>(new Date());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const lastOwnerPct = cortes.length > 0 ? cortes[0].ownerPct : 40;

  const fetchCortes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const from = new Date(filterDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(filterDate);
      to.setHours(23, 59, 59, 999);

      params.set("from", from.toISOString());
      params.set("to", to.toISOString());
      if (isAdmin && filterEmployee !== "all") params.set("employeeId", filterEmployee);

      const res = await fetch(`/api/cortes?${params}`);
      if (res.ok) setCortes(await res.json());
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterEmployee, isAdmin]);

  useEffect(() => {
    fetchCortes();
    if (isAdmin) {
      const CORTES_EXCLUDED = ["maxwell@churco.com", "freddy@churco.com", "userSuc2@gmail.com"];
      fetch("/api/users?role=EMPLOYEE")
        .then((r) => r.ok ? r.json() : [])
        .then((data) => setEmployees(Array.isArray(data) ? data.filter((u: Employee) => !CORTES_EXCLUDED.includes(u.email)) : []))
        .catch(() => {});
    }
  }, [isAdmin, fetchCortes]);

  async function handleDelete(id: string) {
    await fetch(`/api/cortes/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchCortes();
  }

  // Summary calculations
  const totalBruto = cortes.reduce((s, c) => s + c.price, 0);
  const totalDueno = cortes.reduce((s, c) => s + c.ownerAmount, 0);
  const totalEmpleado = cortes.reduce((s, c) => s + c.employeeAmount, 0);

  const labelStyle = { color: "rgba(252,85,0,0.55)" };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
        <div>
          <h2 className="font-display text-4xl font-bold" style={{ color: "#eae1d4" }}>Cortes</h2>
          <p className="font-sans text-sm mt-1" style={{ color: "rgba(234,225,212,0.45)" }}>
            {isAdmin ? "Registro de cortes por barbero y cálculo de liquidación." : "Registra tus cortes del día y ve tu liquidación."}
          </p>
        </div>
        <div className="flex gap-sm items-center flex-wrap">
          {/* Date filter */}
          <DatePicker
            selected={filterDate}
            onChange={(d: Date | null) => d && setFilterDate(d)}
            dateFormat="dd/MM/yyyy"
            locale="es"
            showPopperArrow={false}
            maxDate={new Date()}
            className="px-4 py-2 rounded font-sans text-sm outline-none transition-colors datepicker-gold"
          />
          {/* Employee filter (admin only) */}
          {isAdmin && employees.length > 0 && (
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="px-3 py-2 rounded font-sans text-sm outline-none"
              style={{ background: "var(--surface-2)", border: "1px solid rgba(252,85,0,0.15)", color: "#eae1d4", colorScheme: "dark" }}
            >
              <option value="all">Todos los barberos</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="btn-gold px-lg py-md rounded flex items-center gap-sm"
          >
            <span className="material-symbols-outlined icon-sm">content_cut</span>
            Registrar Corte
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-sm mb-xl">
        <div className="card-premium rounded-lg px-4 py-3 text-center">
          <div className="font-sans text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>Cortes</div>
          <div className="font-display text-2xl font-bold" style={{ color: "#eae1d4" }}>{cortes.length}</div>
        </div>
        <div className="card-premium rounded-lg px-4 py-3 text-center">
          <div className="font-sans text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>Total bruto</div>
          <div className="font-display text-xl font-bold text-gold-gradient">${totalBruto.toLocaleString("es-CO")}</div>
        </div>
        <div className="card-premium rounded-lg px-4 py-3 text-center">
          <div className="font-sans text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>Para el dueño</div>
          <div className="font-display text-xl font-bold" style={{ color: "#fc5500" }}>${totalDueno.toLocaleString("es-CO")}</div>
        </div>
        <div className="card-premium rounded-lg px-4 py-3 text-center">
          <div className="font-sans text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>{isAdmin ? "Para barberos" : "Para mí"}</div>
          <div className="font-display text-xl font-bold" style={{ color: "#eae1d4" }}>${totalEmpleado.toLocaleString("es-CO")}</div>
        </div>
      </div>

      {/* Cortes table */}
      <div className="card-premium rounded-lg overflow-hidden">
        <div
          className="hidden md:grid gap-md p-md font-sans text-[10px] font-bold uppercase tracking-wider"
          style={{
            gridTemplateColumns: isAdmin ? "1fr 100px 120px 120px 120px 60px" : "1fr 100px 120px 120px 60px",
            borderBottom: "1px solid rgba(252,85,0,0.08)",
            color: "rgba(252,85,0,0.5)",
          }}
        >
          <span>Hora / Nota</span>
          {isAdmin && <span>Barbero</span>}
          <span>Valor</span>
          <span>Dueño</span>
          <span>Empleado</span>
          <span />
        </div>

        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="p-md animate-pulse" style={{ borderBottom: "1px solid rgba(252,85,0,0.06)" }}>
              <div className="h-8 rounded" style={{ background: "var(--surface-3)" }} />
            </div>
          ))
        ) : cortes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: "rgba(234,225,212,0.35)" }}>
            <span className="material-symbols-outlined text-4xl mb-2">content_cut</span>
            <span className="font-sans text-sm">Sin cortes registrados para este día</span>
          </div>
        ) : (
          cortes.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-1 gap-sm p-md items-center transition-colors"
              style={{
                gridTemplateColumns: isAdmin ? "1fr 100px 120px 120px 120px 60px" : "1fr 100px 120px 120px 60px",
                borderBottom: "1px solid rgba(252,85,0,0.06)",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(252,85,0,0.03)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
            >
              <div>
                <div className="font-sans text-sm font-medium" style={{ color: "#eae1d4" }}>
                  {new Date(c.createdAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                  <span className="ml-2 font-sans text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{ background: "rgba(252,85,0,0.1)", color: "rgba(252,85,0,0.7)" }}>
                    {c.ownerPct}%
                  </span>
                </div>
                {c.note && <div className="font-sans text-xs mt-0.5" style={{ color: "rgba(234,225,212,0.45)" }}>{c.note}</div>}
              </div>
              {isAdmin && (
                <div className="font-sans text-sm" style={{ color: "rgba(234,225,212,0.65)" }}>{c.employee.name}</div>
              )}
              <div className="font-display font-bold text-sm" style={{ color: "#eae1d4" }}>
                ${c.price.toLocaleString("es-CO")}
              </div>
              <div className="font-display font-bold text-sm" style={{ color: "#fc5500" }}>
                ${c.ownerAmount.toLocaleString("es-CO")}
              </div>
              <div className="font-display font-bold text-sm" style={{ color: "#eae1d4" }}>
                ${c.employeeAmount.toLocaleString("es-CO")}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setDeleteId(c.id)}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: "rgba(234,225,212,0.25)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f87171")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(234,225,212,0.25)")}
                >
                  <span className="material-symbols-outlined icon-sm">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card-premium rounded-xl w-full max-w-xs p-lg flex flex-col gap-lg animate-scale-in shadow-2xl">
            <div className="flex flex-col items-center gap-sm text-center">
              <span className="material-symbols-outlined text-4xl" style={{ color: "#f87171" }}>delete</span>
              <h3 className="font-display text-lg font-semibold" style={{ color: "#eae1d4" }}>Eliminar corte</h3>
              <p className="font-sans text-sm" style={{ color: "rgba(234,225,212,0.55)" }}>¿Confirmas que deseas eliminar este corte? Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex gap-sm">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded font-sans text-xs font-bold uppercase tracking-wider"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(252,85,0,0.1)", color: "rgba(234,225,212,0.5)" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded font-sans text-xs font-bold uppercase tracking-wider"
                style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)", color: "#f87171" }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <CorteModal
          onSave={fetchCortes}
          onClose={() => setShowModal(false)}
          lastOwnerPct={lastOwnerPct}
        />
      )}
    </div>
  );
}
