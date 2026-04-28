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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative gold glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-container/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/3 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant mb-4 shadow-[0_0_30px_rgba(212,175,55,0.15)]">
            <span className="material-symbols-outlined text-3xl text-primary icon-fill">content_cut</span>
          </div>
          <h1 className="text-display-lg font-serif font-black text-amber-500 italic tracking-tight text-4xl leading-tight">
            Groom &amp; Gold
          </h1>
          <p className="text-on-surface-variant text-sm font-sans mt-2">
            Sistema de gestión para barbería
          </p>
        </div>

        {/* Form card */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <h2 className="text-headline-sm font-serif text-on-surface mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-label-caps text-on-surface-variant">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@email.com"
                className="w-full bg-surface-container-high text-on-surface px-4 py-3 rounded border border-outline-variant focus:border-primary focus:ring-0 outline-none font-sans text-sm placeholder-outline transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-label-caps text-on-surface-variant">CONTRASEÑA</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-surface-container-high text-on-surface px-4 py-3 rounded border border-outline-variant focus:border-primary focus:ring-0 outline-none font-sans text-sm placeholder-outline transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-error-container/30 border border-error/30 rounded px-3 py-2 text-sm text-error">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-container text-on-primary font-label-caps text-label-caps py-3 px-6 rounded flex items-center justify-center gap-2 transition-all hover:bg-primary hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Verificando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Ingresar
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-6 font-sans">
          ¿Problemas para ingresar? Contacta al administrador.
        </p>
      </div>
    </div>
  );
}
