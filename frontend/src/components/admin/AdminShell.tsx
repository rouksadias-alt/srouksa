"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/orders",    label: "Pedidos",   icon: "📦" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    adminApi
      .me()
      .then((r) => {
        setUser(r.user);
        setAuthChecked(true);
      })
      .catch(() => router.replace("/admin"));
  }, [router]);

  async function logout() {
    try {
      await adminApi.logout();
    } catch {}
    router.replace("/admin");
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Cargando…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex">
        <div className="px-2 text-lg font-black tracking-tight">Numapetstore</div>
        <p className="px-2 text-xs uppercase tracking-wider text-slate-400">Admin</p>

        <nav className="mt-8 space-y-1">
          {NAV.map((n) => {
            const active = pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-2 text-xs text-slate-500">
          <div className="truncate">{user}</div>
          <button
            onClick={logout}
            className="mt-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="font-black">Numapetstore Admin</div>
          <button
            onClick={logout}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold"
          >
            Salir
          </button>
        </header>

        <nav className="flex gap-2 border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
          {NAV.map((n) => {
            const active = pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold ${
                  active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {n.icon} {n.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
