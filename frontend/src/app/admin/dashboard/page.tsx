"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DateRange } from "@/components/admin/DateRange";
import {
  adminApi,
  isoDaysAgo,
  isoToday,
  statusMeta,
  type StatsResponse,
} from "@/lib/admin-api";

function formatPercent(n: number) {
  return `${(n * 100).toFixed(2)}%`;
}
function formatCurrency(n: number, ccy = "USD") {
  try {
    return new Intl.NumberFormat("es-PA", { style: "currency", currency: ccy }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

export default function DashboardPage() {
  const [from, setFrom] = useState(isoDaysAgo(6));
  const [to, setTo] = useState(isoToday());
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await adminApi.stats(from, to);
      setData(stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-500">
              Métricas filtradas por IP válida (país permitido + sin VPN/proxy).
            </p>
          </div>
        </div>

        <DateRange
          from={from}
          to={to}
          onChange={(f, t) => {
            setFrom(f);
            setTo(t);
          }}
        />

        {error ? (
          <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
        ) : null}

        <StatCards data={data} loading={loading} />

        {data ? (
          <>
            <DailyBars data={data} />
            <div className="grid gap-4 lg:grid-cols-3">
              <StatusBreakdown data={data} />
              <TopList
                title="Ciudades top"
                rows={data.top_cities.map((c) => ({ label: c.city, value: c.visits }))}
              />
              <TopList
                title="Fuentes top (UTM)"
                rows={data.top_sources.map((s) => ({ label: s.source, value: s.visits }))}
              />
            </div>
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}

function StatCards({ data, loading }: { data: StatsResponse | null; loading: boolean }) {
  const cards = [
    {
      label: "Visitas válidas",
      value: data?.visits.valid ?? 0,
      sub: data ? `de ${data.visits.total.toLocaleString()} totales · ${data.visits.vpn} VPN` : "",
    },
    {
      label: "Sesiones únicas",
      value: data?.visits.sessions_valid ?? 0,
      sub: data ? `${data.visits.sessions_total.toLocaleString()} totales` : "",
    },
    {
      label: "Pedidos válidos",
      value: data?.orders.valid ?? 0,
      sub: data ? `${data.orders.total.toLocaleString()} totales` : "",
    },
    {
      label: "Conversión",
      value: data ? formatPercent(data.conversion_rate) : "—",
      sub: data ? `pedidos válidos / visitas válidas` : "",
    },
    {
      label: "Ingresos",
      value: data ? formatCurrency(data.orders.revenue) : "—",
      sub: data ? `excl. cancelados / devueltos` : "",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {c.label}
          </div>
          <div className="mt-1 text-2xl font-black tracking-tight">
            {loading ? "…" : (typeof c.value === "number" ? c.value.toLocaleString() : c.value)}
          </div>
          <div className="mt-1 text-xs text-slate-400">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

function DailyBars({ data }: { data: StatsResponse }) {
  const max = Math.max(1, ...data.daily.map((d) => Math.max(d.visits_valid, d.orders_valid * 10)));
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold">Diario</h3>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-3 rounded-sm bg-slate-900" /> Visitas válidas
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-3 rounded-sm bg-emerald-500" /> Pedidos válidos
          </span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 sm:grid-cols-14 lg:grid-cols-14">
        <div className="col-span-full overflow-x-auto">
          <div className="flex items-end gap-1.5" style={{ minWidth: data.daily.length * 38 }}>
            {data.daily.map((d) => (
              <div key={d.day} className="flex w-9 flex-col items-center gap-1">
                <div className="flex h-32 w-full items-end gap-0.5">
                  <div
                    className="flex-1 rounded-t bg-slate-900"
                    style={{ height: `${(d.visits_valid / max) * 100}%` }}
                    title={`${d.visits_valid} visitas`}
                  />
                  <div
                    className="flex-1 rounded-t bg-emerald-500"
                    style={{ height: `${((d.orders_valid * 10) / max) * 100}%` }}
                    title={`${d.orders_valid} pedidos`}
                  />
                </div>
                <div className="text-[10px] text-slate-400">{d.day.slice(5)}</div>
                <div className="text-[10px] font-semibold text-slate-700">
                  {d.visits_valid}/{d.orders_valid}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBreakdown({ data }: { data: StatsResponse }) {
  const bs = data.orders.by_status;
  const items = [
    { key: "pending",   ...statusMeta("pending_confirmation") },
    { key: "confirmed", ...statusMeta("confirmed") },
    { key: "shipped",   ...statusMeta("shipped") },
    { key: "delivered", ...statusMeta("delivered") },
    { key: "cancelled", ...statusMeta("cancelled") },
  ];
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <h3 className="mb-3 font-bold">Pedidos por estado</h3>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.key} className="flex items-center justify-between text-sm">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${it.color}`}>
              {it.label}
            </span>
            <span className="font-bold">
              {(bs as Record<string, number>)[it.key] ?? 0}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TopList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <h3 className="mb-3 font-bold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">Sin datos</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={`${r.label}-${i}`} className="flex items-center justify-between text-sm">
              <span className="truncate text-slate-700">{r.label}</span>
              <span className="font-bold">{r.value.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
