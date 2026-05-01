"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Credenciales incorrectas. Verifica tu email y contraseña.");
      setLoading(false);
    } else {
      router.push("/pos");
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--surface-0)" }}>

      {/* ── Left panel: decorative brand ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 relative overflow-hidden p-12"
        style={{
          background: "linear-gradient(160deg, #16130b 0%, #0d0b06 60%, #1c1810 100%)",
          borderRight: "1px solid rgba(212,175,55,0.1)",
        }}
      >
        {/* Corner ornament top-right */}
        <div
          className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
          style={{
            background: "radial-gradient(circle at top right, rgba(212,175,55,0.06) 0%, transparent 70%)",
          }}
        />
        {/* Corner ornament bottom-left */}
        <div
          className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none"
          style={{
            background: "radial-gradient(circle at bottom left, rgba(212,175,55,0.05) 0%, transparent 70%)",
          }}
        />

        {/* Diagonal line art */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="diag" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              <line x1="0" y1="0" x2="0" y2="40" stroke="#d4af37" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diag)" />
        </svg>

        {/* Brand mark */}
        <div>
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-8"
            style={{
              background: "rgba(212,175,55,0.08)",
              border: "1px solid rgba(212,175,55,0.2)",
              boxShadow: "0 0 40px rgba(212,175,55,0.1)",
            }}
          >
            <span className="material-symbols-outlined icon-fill" style={{ color: "var(--gold)", fontSize: 28 }}>
              content_cut
            </span>
          </div>

          <h1
            className="font-display text-6xl font-bold italic leading-none mb-3"
            style={{ color: "var(--gold-light)" }}
          >
            Conta
            <br />
            <span className="text-gold-gradient">Churco</span>
          </h1>

          <div className="divider-gold my-6 w-24" />

          <p className="font-sans text-sm leading-relaxed" style={{ color: "rgba(234,225,212,0.45)" }}>
            Sistema de gestión exclusivo
            <br />
            para barbería de alta gama.
          </p>
        </div>

        {/* Bottom tagline */}
        <div>
          <p className="font-display italic text-2xl" style={{ color: "rgba(212,175,55,0.3)" }}>
            &ldquo;El arte del buen corte.&rdquo;
          </p>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">

        {/* Subtle center glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(212,175,55,0.03) 0%, transparent 80%)",
          }}
        />

        <div className="w-full max-w-sm animate-fade-up">

          {/* Mobile logo (only on small screens) */}
          <div className="lg:hidden text-center mb-10">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
              style={{
                background: "rgba(212,175,55,0.08)",
                border: "1px solid rgba(212,175,55,0.2)",
                boxShadow: "0 0 30px rgba(212,175,55,0.1)",
              }}
            >
              <span className="material-symbols-outlined icon-fill" style={{ color: "var(--gold)", fontSize: 26 }}>
                content_cut
              </span>
            </div>
            <h1 className="font-display text-4xl font-bold italic text-gold-gradient">ContaChurco</h1>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <h2 className="font-display text-3xl font-semibold" style={{ color: "#eae1d4" }}>
              Bienvenido
            </h2>
            <p className="font-sans text-sm mt-1" style={{ color: "rgba(234,225,212,0.45)" }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <label
                className="font-sans text-[10px] font-bold uppercase tracking-[0.15em]"
                style={{ color: "rgba(212,175,55,0.7)" }}
              >
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@email.com"
                className="input-premium"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                className="font-sans text-[10px] font-bold uppercase tracking-[0.15em]"
                style={{ color: "rgba(212,175,55,0.7)" }}
              >
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="input-premium"
              />
            </div>

            {error && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded text-sm font-sans animate-fade-in"
                style={{
                  background: "rgba(220,38,38,0.08)",
                  border: "1px solid rgba(220,38,38,0.2)",
                  color: "#f87171",
                }}
              >
                <span className="material-symbols-outlined icon-sm">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-4 rounded flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined icon-sm animate-spin">progress_activity</span>
                  Verificando…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined icon-sm">login</span>
                  Ingresar al sistema
                </>
              )}
            </button>
          </form>

          <p
            className="text-center font-sans text-xs mt-10"
            style={{ color: "rgba(234,225,212,0.3)" }}
          >
            ¿Problemas para ingresar? Contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
