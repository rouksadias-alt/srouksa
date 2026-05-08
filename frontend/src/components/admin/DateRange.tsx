"use client";

import { isoDaysAgo, isoToday } from "@/lib/admin-api";

interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

const PRESETS: { label: string; from: () => string; to: () => string }[] = [
  { label: "Hoy",         from: () => isoToday(),       to: () => isoToday() },
  { label: "Ayer",        from: () => isoDaysAgo(1),    to: () => isoDaysAgo(1) },
  { label: "Últ. 7 días", from: () => isoDaysAgo(6),    to: () => isoToday() },
  { label: "Últ. 30 días",from: () => isoDaysAgo(29),   to: () => isoToday() },
  { label: "Últ. 90 días",from: () => isoDaysAgo(89),   to: () => isoToday() },
];

export function DateRange({ from, to, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => {
          const active = p.from() === from && p.to() === to;
          return (
            <button
              key={p.label}
              onClick={() => onChange(p.from(), p.to())}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={from}
          onChange={(e) => onChange(e.target.value, to)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
        />
        <span className="text-slate-400">→</span>
        <input
          type="date"
          value={to}
          onChange={(e) => onChange(from, e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
        />
      </div>
    </div>
  );
}
