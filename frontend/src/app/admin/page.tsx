"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin-api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminApi
      .me()
      .then(() => router.replace("/admin/dashboard"))
      .catch(() => null);
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminApi.login(username.trim(), password);
      router.replace("/admin/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200"
      >
        <h1 className="text-2xl font-black tracking-tight">Numapetstore Admin</h1>
        <p className="mt-1 text-sm text-slate-500">Inicia sesión para continuar.</p>

        <label className="mt-6 block text-sm font-semibold">Usuario</label>
        <input
          autoFocus
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
        />

        <label className="mt-4 block text-sm font-semibold">Contraseña</label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
        />

        {error ? (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-slate-900 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
}
