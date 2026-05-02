"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Category = { id: string; name: string; slug: string };
type Product = {
  id: string; name: string; sku: string; price: number; stock: number;
  minStock: number; image: string | null; active: boolean;
  category: Category;
};

function ProductModal({ product, categories, onSave, onClose }: {
  product: Partial<Product> | null;
  categories: Category[];
  onSave: (data: Partial<Product>) => Promise<void>;
  onClose: () => void;
}) {
  const isNew = !product?.id;
  const [form, setForm] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    price: product?.price ?? 0,
    stock: product?.stock ?? 0,
    minStock: product?.minStock ?? 5,
    image: product?.image ?? "",
    categoryId: product?.category?.id ?? (categories[0]?.id ?? ""),
    active: product?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result as string }));
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({ ...form, id: product?.id });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card-premium rounded-xl w-full max-w-lg animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto">
        <div
          className="p-lg flex items-center justify-between sticky top-0 z-10"
          style={{ background: "var(--surface-1)", borderBottom: "1px solid rgba(212,175,55,0.1)" }}
        >
          <h3 className="font-display text-xl font-semibold" style={{ color: "#eae1d4" }}>
            {isNew ? "Agregar Producto" : "Editar Producto"}
          </h3>
          <button onClick={onClose} style={{ color: "rgba(234,225,212,0.4)" }} className="hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-lg flex flex-col gap-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {[
              { label: "Nombre *", key: "name", type: "text", required: true, colSpan: true },
              { label: "SKU *", key: "sku", type: "text", required: true },
            ].map(({ label, key, type, required, colSpan }) => (
              <div key={key} className={`flex flex-col gap-2 ${colSpan ? "md:col-span-2" : ""}`}>
                <label className="font-sans text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.6)" }}>
                  {label}
                </label>
                <input
                  required={required}
                  type={type}
                  value={(form as Record<string, unknown>)[key] as string}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="input-premium"
                />
              </div>
            ))}
            <div className="flex flex-col gap-2">
              <label className="font-sans text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.6)" }}>
                Categoría *
              </label>
              <select
                required
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="input-premium"
                style={{ background: "var(--surface-2)", color: "#eae1d4", colorScheme: "dark" }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: "#1a1610", color: "#eae1d4" }}>{c.name}</option>
                ))}
              </select>
            </div>
            {[
              { label: "Precio *", key: "price", type: "number", step: "0.01" },
              { label: "Stock actual", key: "stock", type: "number" },
              { label: "Stock mínimo", key: "minStock", type: "number" },
            ].map(({ label, key, type, step }) => (
              <div key={key} className="flex flex-col gap-2">
                <label className="font-sans text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.6)" }}>
                  {label}
                </label>
                <input
                  required={key === "price"}
                  type={type}
                  min={0}
                  step={step}
                  value={(form as Record<string, unknown>)[key] as number}
                  onChange={(e) => setForm({ ...form, [key]: key === "price" ? parseFloat(e.target.value) : parseInt(e.target.value) })}
                  className="input-premium"
                />
              </div>
            ))}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="font-sans text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.6)" }}>
                Imagen del producto
              </label>
              <div className="flex items-center gap-sm">
                <label
                  className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded font-sans text-xs font-bold uppercase tracking-wider transition-colors"
                  style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", color: "rgba(212,175,55,0.8)" }}
                >
                  <span className="material-symbols-outlined icon-sm">upload</span>
                  Elegir imagen
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
                {form.image && (
                  <>
                    <Image src={form.image} alt="preview" width={48} height={48} className="w-12 h-12 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image: "" })}
                      className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                      style={{ color: "rgba(234,225,212,0.4)" }}
                    >
                      <span className="material-symbols-outlined icon-sm">close</span>
                    </button>
                  </>
                )}
                {!form.image && (
                  <span className="font-sans text-xs" style={{ color: "rgba(234,225,212,0.3)" }}>Sin imagen</span>
                )}
              </div>
            </div>
            {!isNew && (
              <div className="flex items-center gap-sm md:col-span-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="active" className="font-sans text-sm" style={{ color: "#eae1d4" }}>Producto activo</label>
              </div>
            )}
          </div>

          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded text-sm font-sans"
              style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#f87171" }}
            >
              <span className="material-symbols-outlined icon-sm">error</span>
              {error}
            </div>
          )}

          <div className="flex gap-sm mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded font-sans text-xs font-bold uppercase tracking-wider transition-colors"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(212,175,55,0.1)",
                color: "rgba(234,225,212,0.5)",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-gold flex-1 py-3 rounded flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving
                ? <span className="material-symbols-outlined icon-sm animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined icon-sm">save</span>
              }
              {isNew ? "Agregar" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ active: "false" });
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (search) params.set("search", search);
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) setProducts(await res.json());
    } finally {
      setLoading(false);
    }
  }, [activeCategory, search]);

  useEffect(() => {
    if (!isAdmin) { router.push("/pos"); return; }
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, [isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts, isAdmin]);

  async function handleSave(data: Partial<Product>) {
    const url = data.id ? `/api/products/${data.id}` : "/api/products";
    const method = data.id ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Error al guardar");
    }
    fetchProducts();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchProducts();
  }

  if (!isAdmin) return null;

  const lowStockCount = products.filter((p) => p.stock <= p.minStock && p.active).length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
        <div>
          <h2 className="font-display text-4xl font-bold" style={{ color: "#eae1d4" }}>Gestión de Inventario</h2>
          <p className="font-sans text-sm mt-1" style={{ color: "rgba(234,225,212,0.45)" }}>
            Administra productos, niveles de stock y precios.
            {lowStockCount > 0 && (
              <span className="ml-2 font-semibold" style={{ color: "#f87171" }}>
                · {lowStockCount} producto{lowStockCount > 1 ? "s" : ""} con stock bajo
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setEditingProduct({})}
          className="btn-gold px-lg py-md rounded flex items-center justify-center gap-sm shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Agregar Producto
        </button>
      </div>

      {/* Search & filters */}
      <div className="flex flex-col lg:flex-row gap-md mb-lg">
        <div className="relative flex-1 max-w-md">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 icon-sm"
            style={{ color: "rgba(153,144,124,0.5)" }}
          >
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU…"
            className="w-full rounded-lg py-3 pl-10 pr-4 font-sans text-sm outline-none transition-colors"
            style={{
              background: "var(--surface-2)",
              border: "1px solid rgba(212,175,55,0.1)",
              color: "#eae1d4",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.35)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.1)")}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
          {[{ slug: "all", name: "Todos" }, ...categories].map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className="font-sans text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-full whitespace-nowrap shrink-0 transition-all"
                style={
                  isActive
                    ? { background: "rgba(212,175,55,0.15)", color: "var(--gold-light)", border: "1px solid rgba(212,175,55,0.35)" }
                    : { background: "var(--surface-2)", color: "rgba(234,225,212,0.4)", border: "1px solid rgba(212,175,55,0.06)" }
                }
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products table */}
      <div className="card-premium rounded-lg overflow-hidden flex flex-col">
        {/* Table header */}
        <div
          className="hidden md:grid grid-cols-[80px_2fr_1fr_1fr_1fr_140px] gap-md p-md font-sans text-[10px] font-bold uppercase tracking-wider"
          style={{ borderBottom: "1px solid rgba(212,175,55,0.08)", color: "rgba(212,175,55,0.5)" }}
        >
          <div>Imagen</div>
          <div>Producto</div>
          <div>Categoría</div>
          <div className="text-right">Stock</div>
          <div className="text-right">Precio</div>
          <div className="text-right">Acciones</div>
        </div>

        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-[80px_2fr_1fr_1fr_1fr_140px] gap-md p-md items-center animate-pulse" style={{ borderBottom: "1px solid rgba(212,175,55,0.06)" }}>
              <div className="hidden md:block w-16 h-16 rounded" style={{ background: "var(--surface-3)" }} />
              <div className="h-8 rounded col-span-5" style={{ background: "var(--surface-3)" }} />
            </div>
          ))
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
            <span className="font-sans text-sm">No se encontraron productos</span>
          </div>
        ) : (
          products.map((product) => {
            const lowStock = product.stock <= product.minStock;
            return (
              <div
                key={product.id}
                className={`grid grid-cols-1 md:grid-cols-[80px_2fr_1fr_1fr_1fr_140px] gap-y-sm gap-x-md p-md items-center transition-colors group relative ${!product.active ? "opacity-50" : ""}`}
            style={{ borderBottom: "1px solid rgba(212,175,55,0.06)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.03)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                {lowStock && <div className="absolute left-0 top-0 bottom-0 w-1 bg-error rounded-l-lg" />}

                {/* Desktop image */}
                <div className={`w-16 h-16 rounded bg-surface-container-high overflow-hidden shrink-0 hidden md:block ${lowStock ? "ml-2" : ""}`}>
                  {product.image ? (
                    <Image src={product.image} alt={product.name} width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-outline text-[28px]">inventory_2</span>
                    </div>
                  )}
                </div>

                {/* Mobile view */}
                <div className={`flex items-center gap-md md:hidden mb-2 ${lowStock ? "ml-2" : ""}`}>
                  <div className="w-12 h-12 rounded bg-surface-container-high overflow-hidden shrink-0">
                    {product.image ? (
                      <Image src={product.image} alt={product.name} width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-outline text-[20px]">inventory_2</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-sans font-semibold text-[15px] text-on-surface leading-tight">{product.name}</div>
                    <div className="text-xs text-on-surface-variant mt-0.5">SKU: {product.sku}</div>
                  </div>
                </div>

                {/* Desktop name */}
                <div className={`hidden md:block ${lowStock ? "ml-2" : ""}`}>
                  <div className="font-sans font-semibold text-[15px] text-on-surface leading-tight">{product.name}</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">SKU: {product.sku}</div>
                  {!product.active && <span className="text-[10px] text-outline font-label-caps">INACTIVO</span>}
                </div>

                <div className={lowStock ? "ml-2 md:ml-0" : ""}>
                  <span
                    className="inline-block font-sans text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded"
                    style={{ background: "rgba(212,175,55,0.08)", color: "rgba(212,175,55,0.6)" }}
                  >
                    {product.category.name}
                  </span>
                </div>

                <div className={`flex justify-between md:block text-right ${lowStock ? "ml-2 md:ml-0" : ""}`}>
                  <span className="md:hidden font-label-caps text-label-caps text-on-surface-variant">Stock:</span>
                  <div className="flex items-center justify-end gap-1">
                    {lowStock && <span className="material-symbols-outlined text-[14px] text-error icon-fill">warning</span>}
                    <span className={`font-sans ${lowStock ? "text-error font-bold" : "text-on-surface"}`}>{product.stock}</span>
                    <span className="text-on-surface-variant text-xs">/ {product.minStock}</span>
                  </div>
                </div>

                <div className={`flex justify-between md:block text-right ${lowStock ? "ml-2 md:ml-0" : ""}`}>
                  <span className="md:hidden font-label-caps text-label-caps text-on-surface-variant">Precio:</span>
                  <span className="text-primary font-sans">${Number(product.price).toLocaleString("es-MX")}</span>
                </div>

                {/* Actions */}
                <div className={`flex justify-end gap-sm mt-sm md:mt-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity ${lowStock ? "ml-2 md:ml-0" : ""}`}>
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="w-8 h-8 rounded border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary flex items-center justify-center transition-colors"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteId(product.id)}
                    className="w-8 h-8 rounded border border-outline-variant text-on-surface-variant hover:text-error hover:border-error flex items-center justify-center transition-colors"
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit / Create modal */}
      {editingProduct !== undefined && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onSave={handleSave}
          onClose={() => setEditingProduct(undefined)}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg w-full max-w-sm animate-scale-in shadow-2xl">
            <div className="flex items-center gap-sm mb-md">
              <span className="material-symbols-outlined text-error text-2xl">delete_forever</span>
              <h3 className="font-serif text-headline-sm text-on-surface">¿Eliminar producto?</h3>
            </div>
            <p className="text-on-surface-variant font-sans text-sm mb-lg">
              El producto será eliminado permanentemente. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-sm">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 bg-surface-container-high border border-outline-variant text-on-surface py-2 rounded font-label-caps text-label-caps hover:bg-surface-container-highest transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-error-container text-on-error-container py-2 rounded font-label-caps text-label-caps flex items-center justify-center gap-1 hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
