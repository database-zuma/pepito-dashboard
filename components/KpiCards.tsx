"use client";

import { formatRupiah, formatNumber } from "@/lib/utils";
import type { OverviewMetrics } from "@/lib/types";

interface KpiCardsProps {
  metrics?: OverviewMetrics;
  loading?: boolean;
}

const KPI_CONFIG = [
  { label: "REVENUE", key: "revenue", format: (v: number) => formatRupiah(v ?? 0), subtitle: "" },
  { label: "PAIRS SOLD", key: "pairs", format: (v: number) => formatNumber(v ?? 0), subtitle: "" },
  { label: "TRANSACTIONS", key: "transactions", format: (v: number) => formatNumber(v ?? 0), subtitle: "" },
  { label: "ATU", key: "atu", format: (v: number) => (v ?? 0).toFixed(1), subtitle: "Avg Pairs/Transaction" },
  { label: "ASP", key: "asp", format: (v: number) => formatRupiah(v ?? 0), subtitle: "Avg Selling Price" },
  { label: "ATV", key: "atv", format: (v: number) => formatRupiah(v ?? 0), subtitle: "Avg Transaction Value" },
];

function computeKpis(m?: OverviewMetrics): Record<string, number> {
  if (!m) return { revenue: 0, pairs: 0, transactions: 0, atu: 0, asp: 0, atv: 0 };
  const totalRevenue = m.totalRevenue ?? 0;
  const totalQty = m.totalQty ?? 0;
  const totalInvoices = m.totalInvoices ?? 0;
  return {
    revenue: totalRevenue,
    pairs: totalQty,
    transactions: totalInvoices,
    atu: totalInvoices > 0 ? totalQty / totalInvoices : 0,
    asp: totalQty > 0 ? totalRevenue / totalQty : 0,
    atv: totalInvoices > 0 ? totalRevenue / totalInvoices : 0,
  };
}

export default function KpiCards({ metrics, loading }: KpiCardsProps) {
  const kpis = computeKpis(metrics);

  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {KPI_CONFIG.map((k) => (
          <div key={k.key} className="bg-card border border-border rounded-sm p-3 animate-pulse">
            <div className="h-3 w-16 bg-muted rounded-sm mb-2" />
            <div className="h-5 w-20 bg-muted rounded-sm" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {KPI_CONFIG.map((k) => (
        <div key={k.key} className="bg-card border-l-2 border-l-[#00E273] border border-border rounded-sm p-3">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">{k.label}</p>
          <p className="text-sm font-bold text-foreground tabular-nums mt-1">{k.format(kpis[k.key as keyof typeof kpis])}</p>
          {k.subtitle && <p className="text-[9px] text-muted-foreground mt-0.5">{k.subtitle}</p>}
        </div>
      ))}
    </div>
  );
}
