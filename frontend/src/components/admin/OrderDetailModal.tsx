"use client";

import { useEffect, useState } from "react";
import {
  adminApi,
  ORDER_STATUSES,
  statusMeta,
  type OrderDetailResponse,
} from "@/lib/admin-api";

interface Props {
  orderId: string;
  onClose: () => void;
  onChange: () => void;
}

export function OrderDetailModal({ orderId, onClose, onChange }: Props) {
  const [data, setData] = useState<OrderDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminApi
      .order(orderId)
      .then((r) => {
        if (cancelled) return;
        setData(r);
        setNotes(r.order.admin_notes ?? "");
        setCourier(r.order.courier ?? "");
        setTracking(r.order.tracking_number ?? "");
        setCancellationReason(r.order.cancellation_reason ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "error"));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function update(body: Parameters<typeof adminApi.updateOrder>[1]) {
    setSaving(true);
    setError(null);
    try {
      await adminApi.updateOrder(orderId, body);
      const fresh = await adminApi.order(orderId);
      setData(fresh);
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[95dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-wide text-slate-400">
              Pedido
            </div>
            <h2 className="text-xl font-black">
              {data?.order.order_number ?? "…"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold hover:bg-slate-200"
          >
            Cerrar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error ? (
            <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          {!data ? (
            <p className="text-slate-400">Cargando…</p>
          ) : (
            <div className="space-y-6">
              <StatusRow data={data} onUpdate={(s) => update({ status: s })} saving={saving} />

              <div className="grid gap-4 lg:grid-cols-2">
                <Card title="Cliente">
                  <Field label="Nombre" value={data.order.customer_name} />
                  <Field label="Teléfono" value={data.order.phone_e164} mono />
                  <Field
                    label="Dirección"
                    value={
                      [data.order.address, data.order.city].filter(Boolean).join(", ") || "—"
                    }
                  />
                </Card>

                <Card title="Origen / IP">
                  <Field
                    label="País / Ciudad"
                    value={
                      [data.order.geo_city, data.order.geo_country]
                        .filter(Boolean)
                        .join(", ") || "—"
                    }
                  />
                  <Field label="IP" value={data.order.ip_address ?? "—"} mono />
                  <Field
                    label="VPN / Proxy"
                    value={
                      data.order.is_vpn ? (
                        <span className="font-bold text-rose-600">⚠ Detectado</span>
                      ) : (
                        "No"
                      )
                    }
                  />
                </Card>
              </div>

              <Card title="Productos">
                <ul className="divide-y divide-slate-100">
                  {data.items.map((it) => (
                    <li key={it.id} className="flex items-start justify-between py-2">
                      <div>
                        <div className="font-semibold">
                          {it.quantity}× {it.product_name}
                          {it.is_upsell ? (
                            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                              upsell
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-slate-500">{it.offer_label}</div>
                      </div>
                      <div className="font-bold">${(it.price * it.quantity).toFixed(2)}</div>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-black">${data.order.total.toFixed(2)}</span>
                </div>
              </Card>

              <Card title="Envío">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Courier</label>
                    <input
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Uber Direct, 99 Minutos…"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Nº de seguimiento</label>
                    <input
                      value={tracking}
                      onChange={(e) => setTracking(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  disabled={saving}
                  onClick={() => update({ courier, tracking_number: tracking })}
                  className="mt-3 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Guardar envío
                </button>
              </Card>

              <Card title="Notas internas">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Cliente prefiere mañana, llamar a las 10h…"
                />
                <button
                  disabled={saving}
                  onClick={() => update({ admin_notes: notes })}
                  className="mt-2 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Guardar notas
                </button>
              </Card>

              <Card title="Cancelación">
                <input
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Motivo (cliente cancela / no contesta / fraude…)"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  disabled={saving}
                  onClick={() =>
                    update({ cancellation_reason: cancellationReason, status: "cancelled" })
                  }
                  className="mt-2 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Marcar como cancelado
                </button>
              </Card>

              <div className="text-xs text-slate-400">
                Creado: {new Date(data.order.created_at).toLocaleString("es-PA")} · Actualizado: {new Date(data.order.updated_at).toLocaleString("es-PA")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="space-y-2 text-sm">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right font-semibold ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function StatusRow({
  data,
  onUpdate,
  saving,
}: {
  data: OrderDetailResponse;
  onUpdate: (status: string) => void;
  saving: boolean;
}) {
  const current = statusMeta(data.order.status);
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Estado actual
          </div>
          <span className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ${current.color}`}>
            {current.label}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ORDER_STATUSES.map((s) => (
            <button
              key={s.value}
              disabled={saving || s.value === data.order.status}
              onClick={() => onUpdate(s.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${s.color} hover:brightness-95`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
