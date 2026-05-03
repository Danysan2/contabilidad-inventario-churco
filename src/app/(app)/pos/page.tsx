"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

function resolveImage(src: string): string {
  if (src.startsWith("data:") || src.startsWith("http") || src.startsWith("/")) return src;
  return `/imagenes/${encodeURIComponent(src)}`;
}

type Category = { id: string; name: string; slug: string };
type Product = {
  id: string; name: string; sku: string; price: number; stock: number;
  image: string | null; category: { id: string; name: string; slug: string };
};
type CartItem = { product: Product; quantity: number };

function ProductCard({ product, quantity, onAdd, onRemove }: {
  product: Product; quantity: number;
  onAdd: () => void; onRemove: () => void;
}) {
  const outOfStock = product.stock <= 0;

  return (
    <div
      className={`bg-[#1C1C1C] border rounded-lg overflow-hidden flex flex-col transition-all ${
        quantity > 0 ? "border-primary/50 shadow-[0_0_15px_rgba(212,175,55,0.1)]" : "border-[#2A2A2A]"
      } ${outOfStock ? "opacity-50" : "active:scale-[0.98]"}`}
    >
      <div className="aspect-square relative bg-[#121212] p-3 flex items-center justify-center">
        {product.image ? (
          <Image
            src={resolveImage(product.image)}
            alt={product.name}
            fill
            className="object-contain mix-blend-screen p-3"
            sizes="(max-width: 768px) 50vw, 25vw"
            unoptimized={!product.image.startsWith("http")}
          />
        ) : (
          <span className="material-symbols-outlined text-[48px] text-[#2A2A2A]">inventory_2</span>
        )}

        {/* Quantity badge / add button */}
        {quantity > 0 ? (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/80 backdrop-blur-sm border border-primary/30 rounded-full px-2 py-1">
            <button onClick={onRemove} className="w-5 h-5 flex items-center justify-center text-primary hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>
            <span className="text-primary font-bold font-sans text-sm min-w-[16px] text-center">{quantity}</span>
            <button onClick={onAdd} disabled={outOfStock} className="w-5 h-5 flex items-center justify-center text-primary hover:text-white transition-colors disabled:opacity-30">
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onAdd}
            disabled={outOfStock}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-[#2A2A2A] hover:border-primary/50 flex items-center justify-center text-on-background transition-all disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        )}

        {/* Stock low badge */}
        {product.stock > 0 && product.stock <= 3 && (
          <div className="absolute top-2 left-2 bg-error-container text-error font-label-caps text-[10px] px-2 py-0.5 rounded-full">
            ¡Últimos {product.stock}!
          </div>
        )}
        {outOfStock && (
          <div className="absolute top-2 left-2 bg-zinc-800 text-zinc-400 font-label-caps text-[10px] px-2 py-0.5 rounded-full">
            Sin stock
          </div>
        )}
      </div>

      <div className="p-3 border-t border-[#2A2A2A] flex-grow flex flex-col justify-between gap-1">
        <h3 className="font-sans font-semibold text-sm text-on-background leading-tight">{product.name}</h3>
        <p className="font-label-caps text-label-caps text-primary-container">${Number(product.price).toLocaleString("es-MX")}</p>
      </div>
    </div>
  );
}

function ConfirmModal({ cart, total, onConfirm, onCancel, loading }: {
  cart: CartItem[]; total: number;
  onConfirm: (note: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 pb-24 md:pb-4">
      <div
        className="card-premium rounded-xl w-full max-w-md animate-slide-up shadow-2xl"
      >
        <div
          className="p-lg flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(212,175,55,0.1)" }}
        >
          <h3 className="font-display text-xl font-semibold" style={{ color: "#eae1d4" }}>
            Confirmar Venta
          </h3>
          <button
            onClick={onCancel}
            style={{ color: "rgba(234,225,212,0.4)" }}
            className="transition-colors hover:text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-lg flex flex-col gap-sm">
          <div className="max-h-48 overflow-y-auto flex flex-col gap-sm">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="flex justify-between items-center py-2"
                style={{ borderBottom: "1px solid rgba(212,175,55,0.07)" }}
              >
                <div>
                  <div className="font-sans text-sm" style={{ color: "#eae1d4" }}>{item.product.name}</div>
                  <div className="font-sans text-xs" style={{ color: "rgba(234,225,212,0.4)" }}>
                    x{item.quantity} · ${Number(item.product.price).toLocaleString("es-MX")} c/u
                  </div>
                </div>
                <span className="font-display font-bold" style={{ color: "var(--gold-light)" }}>
                  ${(item.quantity * Number(item.product.price)).toLocaleString("es-MX")}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3">
            <span className="font-sans text-[10px] uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.6)" }}>
              Total
            </span>
            <span className="font-display text-2xl font-bold text-gold-gradient">
              ${total.toLocaleString("es-MX")}
            </span>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <label className="font-sans text-[10px] uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.6)" }}>
              Nota (opcional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Mesa 3, Cortesía VIP…"
              className="input-premium"
            />
          </div>
        </div>

        <div className="p-lg flex gap-sm" style={{ borderTop: "1px solid rgba(212,175,55,0.1)" }}>
          <button
            onClick={onCancel}
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
            onClick={() => onConfirm(note)}
            disabled={loading}
            className="btn-gold flex-grow py-3 px-6 rounded flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="material-symbols-outlined icon-sm animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined icon-sm">check_circle</span>
            )}
            Registrar Venta
          </button>
        </div>
      </div>
    </div>
  );
}

export default function POSPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (search) params.set("search", search);
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) setProducts(await res.json());
    } finally {
      setLoading(false);
    }
  }, [activeCategory, search]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeout);
  }, [fetchProducts]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === productId);
      if (existing && existing.quantity > 1) return prev.map((i) => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter((i) => i.product.id !== productId);
    });
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.quantity * Number(i.product.price), 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  async function handleConfirm(note: string) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity, unitPrice: Number(i.product.price) })),
          note,
        }),
      });
      if (res.ok) {
        setCart([]);
        setShowConfirm(false);
        setSuccessMsg("¡Venta registrada exitosamente!");
        fetchProducts();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto md:max-w-none">
      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-900/90 border border-green-500/30 text-green-400 font-sans text-sm px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {successMsg}
        </div>
      )}

      {/* Page header (desktop) */}
      <div className="hidden md:flex items-end justify-between mb-xl">
        <div>
          <h2 className="font-display text-4xl font-bold" style={{ color: "#eae1d4" }}>Punto de Venta</h2>
          <p className="font-sans text-sm mt-1" style={{ color: "rgba(234,225,212,0.45)" }}>
            Selecciona productos y registra ventas rápidamente.
          </p>
        </div>
        {cart.length > 0 && (
          <div className="flex items-center gap-md">
            <div className="text-right">
              <div className="font-sans text-[10px] uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.6)" }}>TOTAL</div>
              <div className="font-display text-2xl font-bold text-gold-gradient">${cartTotal.toLocaleString("es-MX")}</div>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="btn-gold py-3 px-6 rounded flex items-center gap-2"
            >
              <span className="material-symbols-outlined icon-sm">point_of_sale</span>
              Cobrar · {cartCount} {cartCount === 1 ? "ítem" : "ítems"}
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="mb-lg flex gap-sm">
        <div className="relative flex-grow">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 icon-sm"
            style={{ color: "rgba(153,144,124,0.5)" }}
          >
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto…"
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
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-sm mb-lg -mx-container-margin px-container-margin md:mx-0 md:px-0 hide-scrollbar">
        {[{ id: "all", slug: "all", name: "Todos" }, ...categories].map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              className="whitespace-nowrap font-sans text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-all"
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

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-sm">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg overflow-hidden animate-pulse">
              <div className="aspect-square bg-[#2A2A2A]" />
              <div className="p-3 h-16 bg-[#1C1C1C]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-sm pb-40 md:pb-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              quantity={cart.find((i) => i.product.id === product.id)?.quantity ?? 0}
              onAdd={() => addToCart(product)}
              onRemove={() => removeFromCart(product.id)}
            />
          ))}
          {products.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
              <span className="font-sans text-sm">No se encontraron productos</span>
            </div>
          )}
        </div>
      )}

      {/* Floating order summary (mobile) */}
      {cart.length > 0 && (
        <div className="fixed bottom-[72px] left-0 w-full px-4 z-40 pb-2 md:hidden">
          <div
            className="rounded-xl p-4 flex items-center justify-between shadow-2xl"
            style={{
              background: "var(--surface-2)",
              border: "1px solid rgba(212,175,55,0.2)",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.6)",
            }}
          >
            <div>
              <p className="font-sans text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(212,175,55,0.55)" }}>
                Orden actual
              </p>
              <p className="font-sans text-sm font-bold" style={{ color: "#eae1d4" }}>
                {cartCount} {cartCount === 1 ? "artículo" : "artículos"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-sans text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(212,175,55,0.55)" }}>
                  Total
                </p>
                <p className="font-display text-xl font-bold text-gold-gradient">
                  ${cartTotal.toLocaleString("es-MX")}
                </p>
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                className="btn-gold py-3 px-5 rounded-lg flex items-center gap-2"
              >
                Cobrar
                <span className="material-symbols-outlined icon-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <ConfirmModal
          cart={cart}
          total={cartTotal}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
          loading={submitting}
        />
      )}

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
