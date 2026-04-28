"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

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
            src={product.image}
            alt={product.name}
            fill
            className="object-contain mix-blend-screen p-3"
            sizes="(max-width: 768px) 50vw, 25vw"
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface-container border border-outline-variant rounded-xl w-full max-w-md animate-slide-up shadow-2xl">
        <div className="p-lg border-b border-outline-variant flex items-center justify-between">
          <h3 className="font-serif text-headline-sm text-on-surface">Confirmar Venta</h3>
          <button onClick={onCancel} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-lg flex flex-col gap-sm">
          <div className="max-h-48 overflow-y-auto flex flex-col gap-sm">
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between items-center py-2 border-b border-outline-variant last:border-0">
                <div>
                  <div className="text-on-surface font-sans text-sm">{item.product.name}</div>
                  <div className="text-on-surface-variant text-xs">x{item.quantity} · ${Number(item.product.price).toLocaleString("es-MX")} c/u</div>
                </div>
                <span className="text-primary font-bold font-sans text-sm">
                  ${(item.quantity * Number(item.product.price)).toLocaleString("es-MX")}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="font-label-caps text-label-caps text-on-surface-variant">TOTAL</span>
            <span className="font-serif text-2xl text-primary font-bold">${total.toLocaleString("es-MX")}</span>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <label className="font-label-caps text-label-caps text-on-surface-variant">NOTA (OPCIONAL)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Mesa 3, Cortesía VIP..."
              className="bg-surface-container-high text-on-surface px-4 py-2 rounded border border-outline-variant focus:border-primary outline-none font-sans text-sm placeholder-outline"
            />
          </div>
        </div>

        <div className="p-lg border-t border-outline-variant flex gap-sm">
          <button
            onClick={onCancel}
            className="flex-1 bg-surface-container-high border border-outline-variant text-on-surface py-3 rounded font-label-caps text-label-caps hover:bg-surface-container-highest transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={loading}
            className="flex-2 flex-grow bg-primary-container text-on-primary py-3 px-6 rounded font-label-caps text-label-caps flex items-center justify-center gap-2 hover:bg-primary hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
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
          <h2 className="font-serif text-headline-md text-on-surface mb-xs">Punto de Venta</h2>
          <p className="text-on-surface-variant font-sans text-sm">Selecciona productos y registra ventas rápidamente.</p>
        </div>
        {cart.length > 0 && (
          <div className="flex items-center gap-md">
            <div className="text-right">
              <div className="font-label-caps text-label-caps text-on-surface-variant">TOTAL</div>
              <div className="font-serif text-2xl text-primary font-bold">${cartTotal.toLocaleString("es-MX")}</div>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="bg-primary-container text-on-primary font-label-caps text-label-caps py-3 px-6 rounded flex items-center gap-2 hover:bg-primary hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
              Cobrar · {cartCount} {cartCount === 1 ? "ítem" : "ítems"}
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="mb-lg flex gap-sm">
        <div className="relative flex-grow">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg py-3 pl-10 pr-4 text-on-background font-sans text-sm focus:border-primary-container focus:ring-0 focus:outline-none placeholder-outline transition-colors"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-sm overflow-x-auto pb-sm mb-lg -mx-container-margin px-container-margin md:mx-0 md:px-0 hide-scrollbar">
        <button
          onClick={() => setActiveCategory("all")}
          className={`whitespace-nowrap font-label-caps text-label-caps px-4 py-2 rounded-full border transition-colors ${
            activeCategory === "all"
              ? "bg-primary-container/20 text-primary-container border-primary-container/30"
              : "bg-[#1C1C1C] text-on-surface-variant border-[#2A2A2A]"
          }`}
        >
          TODOS
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.slug)}
            className={`whitespace-nowrap font-label-caps text-label-caps px-4 py-2 rounded-full border transition-colors ${
              activeCategory === cat.slug
                ? "bg-primary-container/20 text-primary-container border-primary-container/30"
                : "bg-[#1C1C1C] text-on-surface-variant border-[#2A2A2A]"
            }`}
          >
            {cat.name.toUpperCase()}
          </button>
        ))}
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
        <div className="fixed bottom-[72px] left-0 w-full px-container-margin z-40 pb-sm md:hidden">
          <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl p-4 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">ORDEN ACTUAL</p>
              <p className="font-sans text-sm font-bold text-on-background">
                {cartCount} {cartCount === 1 ? "artículo" : "artículos"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">TOTAL</p>
                <p className="font-serif text-xl text-primary-container font-bold">
                  ${cartTotal.toLocaleString("es-MX")}
                </p>
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                className="bg-primary-container text-black font-sans text-sm font-bold py-3 px-5 rounded-lg flex items-center gap-2 active:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-shadow"
              >
                COBRAR
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
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
