"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DateRange } from "@/components/admin/DateRange";
import { OrderDetailModal } from "@/components/admin/OrderDetailModal";
import {
  adminApi,
  isoDaysAgo,
  isoToday,
  ORDER_STATUSES,
  statusMeta,
  type OrderRow,
} from "@/lib/admin-api";

export default function OrdersPage() {
  const [from, setFrom] = useState(isoDaysAgo(29));
  const [to, setTo] = useState(isoToday());
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [q, setQ] = useState("");
  const [showVpn, setShowVpn] = useState(false);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.orders({
        from,
        to,
        status: statusFilter || undefined,
        q: q.trim() || undefined,
        show_vpn: showVpn,
        page,
        page_size: pageSize,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setLoading(false);
    }
  }, [from, to, statusFilter, q, showVpn, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [from, to, statusFilter, q, showVpn]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Pedidos</h1>
          <p className="text-sm text-slate-500">
            {total.toLocaleString()} pedidos en el rango seleccionado
          </p>
        </div>

        <DateRange
          from={from}
          to={to}
          onChange={(f, t) => {
            setFrom(f);
            setTo(t);
          }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Todos los estados</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <input
            placeholder="Buscar por número, nombre, teléfono…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm sm:max-w-md"
          />

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={showVpn}
              onChange={(e) => setShowVpn(e.target.checked)}
            />
            Mostrar VPN
          </label>
        </div>

        {error ? (
          <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
        ) : null}

        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <div className="hidden lg:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Ubicación</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {loading && items.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Cargando…</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Sin pedidos</td></tr>
                ) : (
                  items.map((o) => {
                    const m = statusMeta(o.status);
                    return (
                      <tr
                        key={o.id}
                        onClick={() => setOpenId(o.id)}
                        className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          <div className="font-bold text-slate-900">{o.order_number}</div>
                          {o.is_vpn ? <span className="text-rose-600">⚠ VPN</span> : null}
                        </td>
                        <td className="px-4 py-3">{o.customer_name}</td>
                        <td className="px-4 py-3 font-mono text-xs">{o.phone_e164}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {o.geo_city || o.city || "—"}
                          {o.geo_country ? <span className="ml-1 text-slate-400">({o.geo_country})</span> : null}
                        </td>
                        <td className="px-4 py-3 font-bold">${o.total.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.color}`}>
                            {m.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(o.created_at).toLocaleString("es-PA")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-slate-100 lg:hidden">
            {items.map((o) => {
              const m = statusMeta(o.status);
              return (
                <li
                  key={o.id}
                  onClick={() => setOpenId(o.id)}
                  className="cursor-pointer p-4 active:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-xs font-bold">{o.order_number}</div>
                      <div className="font-semibold">{o.customer_name}</div>
                      <div className="text-xs text-slate-500">{o.phone_e164}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${o.total.toFixed(2)}</div>
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.color}`}>
                        {m.label}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {o.geo_city || o.city || "—"}
                      {o.geo_country ? ` (${o.geo_country})` : ""}
                      {o.is_vpn ? <span className="ml-1 text-rose-600">⚠ VPN</span> : null}
                    </span>
                    <span>{new Date(o.created_at).toLocaleDateString("es-PA")}</span>
                  </div>
                </li>
              );
            })}
            {items.length === 0 && !loading ? (
              <li className="p-8 text-center text-slate-400">Sin pedidos</li>
            ) : null}
          </ul>
        </div>

        <div className="flex items-center justify-between text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-lg bg-white px-3 py-1.5 font-semibold ring-1 ring-slate-200 disabled:opacity-50"
          >
            ← Anterior
          </button>
          <div className="text-slate-500">
            Página {page} de {totalPages}
          </div>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-lg bg-white px-3 py-1.5 font-semibold ring-1 ring-slate-200 disabled:opacity-50"
          >
            Siguiente →
          </button>
        </div>
      </div>

      {openId ? (
        <OrderDetailModal
          orderId={openId}
          onClose={() => setOpenId(null)}
          onChange={() => load()}
        />
      ) : null}
    </AdminShell>
  );
}
