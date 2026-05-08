const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${BASE}/api/admin${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!resp.ok) {
    let detail = "request failed";
    try {
      const data = await resp.json();
      detail = data?.detail ?? detail;
    } catch {}
    throw new AdminApiError(detail, resp.status);
  }
  return (await resp.json()) as T;
}

export const adminApi = {
  login: (username: string, password: string) =>
    request<{ ok: boolean; user: string }>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ ok: boolean }>("/logout", { method: "POST" }),
  me: () => request<{ user: string }>("/me"),
  stats: (from: string, to: string) =>
    request<StatsResponse>(`/stats?from=${from}&to=${to}`),
  orders: (params: OrdersParams) => {
    const q = new URLSearchParams();
    if (params.from) q.set("from", params.from);
    if (params.to) q.set("to", params.to);
    if (params.status) q.set("status", params.status);
    if (params.q) q.set("q", params.q);
    if (params.show_vpn) q.set("show_vpn", "true");
    q.set("page", String(params.page ?? 1));
    q.set("page_size", String(params.page_size ?? 25));
    return request<OrdersResponse>(`/orders?${q.toString()}`);
  },
  order: (id: string) => request<OrderDetailResponse>(`/orders/${id}`),
  updateOrder: (id: string, body: OrderUpdateBody) =>
    request<{ ok: boolean }>(`/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

export interface StatsResponse {
  range: { from: string; to: string };
  visits: {
    total: number;
    valid: number;
    vpn: number;
    sessions_total: number;
    sessions_valid: number;
  };
  orders: {
    total: number;
    valid: number;
    revenue: number;
    by_status: Record<string, number>;
  };
  conversion_rate: number;
  daily: Array<{
    day: string;
    visits_valid: number;
    visits_total: number;
    orders_valid: number;
    orders_total: number;
  }>;
  top_cities: Array<{ city: string; visits: number }>;
  top_sources: Array<{ source: string; visits: number }>;
}

export interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  phone_e164: string;
  phone_raw: string;
  country: string;
  currency: string;
  total: number;
  payment_method: string;
  geo_country: string | null;
  geo_city: string | null;
  is_vpn: boolean;
  city: string | null;
  address: string | null;
  courier: string | null;
  tracking_number: string | null;
  admin_notes: string | null;
  created_at: string;
}

export interface OrdersResponse {
  total: number;
  page: number;
  page_size: number;
  items: OrderRow[];
}

export interface OrdersParams {
  from?: string;
  to?: string;
  status?: string;
  q?: string;
  show_vpn?: boolean;
  page?: number;
  page_size?: number;
}

export interface OrderItem {
  id: string;
  product_slug: string;
  product_name: string;
  offer_label: string;
  quantity: number;
  price: number;
  is_upsell: boolean;
}

export interface OrderDetail extends OrderRow {
  ip_address: string | null;
  cancellation_reason: string | null;
  payload: Record<string, unknown>;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  updated_at: string;
}

export interface OrderDetailResponse {
  order: OrderDetail;
  items: OrderItem[];
}

export interface OrderUpdateBody {
  status?: string;
  admin_notes?: string;
  courier?: string;
  tracking_number?: string;
  cancellation_reason?: string;
}

export const ORDER_STATUSES = [
  { value: "pending_confirmation", label: "Por confirmar", color: "bg-amber-100 text-amber-800" },
  { value: "confirmed",            label: "Confirmado",   color: "bg-blue-100 text-blue-800" },
  { value: "shipped",              label: "Enviado",      color: "bg-indigo-100 text-indigo-800" },
  { value: "delivered",            label: "Entregado",    color: "bg-emerald-100 text-emerald-800" },
  { value: "no_answer",            label: "Sin respuesta",color: "bg-slate-100 text-slate-700" },
  { value: "cancelled",            label: "Cancelado",    color: "bg-rose-100 text-rose-800" },
  { value: "returned",             label: "Devuelto",     color: "bg-stone-200 text-stone-800" },
];

export function statusMeta(value: string) {
  return ORDER_STATUSES.find((s) => s.value === value) ?? ORDER_STATUSES[0];
}

export function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}
