"use client";

import { useState } from "react";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import type { StoreData } from "@/lib/types";

interface StoreTableProps {
  data?: StoreData[];
  loading?: boolean;
}

export default function StoreTable({ data, loading }: StoreTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  if (loading || !data) {
    return <div className="h-80 bg-muted animate-pulse rounded-sm" />;
  }

  const totalPages = Math.ceil(data.length / pageSize);
  const paged = data.slice((page - 1) * pageSize, page * pageSize);
  const totals = data.reduce(
    (acc, s) => ({
      revenue: acc.revenue + s.revenue,
      qty: acc.qty + s.qty,
      skus: acc.skus + s.skus,
      invoices: acc.invoices + s.invoices,
    }),
    { revenue: 0, qty: 0, skus: 0, invoices: 0 }
  );

  const handleExport = () => {
    exportToCSV(
      data.map((s) => ({
        Store: s.storeName,
        Region: s.region,
        Type: s.storeType,
        Revenue: s.revenue,
        Pairs: s.qty,
        SKUs: s.skus,
        Invoices: s.invoices,
        AvgPrice: s.avgPrice,
      })),
      "pepito-stores"
    );
  };

  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Store Performance</h3>
        <button
          onClick={handleExport}
          className="text-[10px] px-2 py-1 border border-border rounded-sm hover:bg-muted transition-colors"
        >
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/40 text-left border-b border-border">
              <th className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[9px]">#</th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[9px]">Store</th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[9px]">Region</th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[9px]">Type</th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[9px] text-right">Revenue</th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[9px] text-right">Pairs</th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[9px] text-right">SKUs</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((s, i) => (
              <tr key={s.storeName} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5 text-muted-foreground tabular-nums">{(page - 1) * pageSize + i + 1}</td>
                <td className="px-3 py-2.5 font-medium text-foreground">{s.storeName}</td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-semibold border ${
                    s.region === "Lombok" ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {s.region}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{s.storeType}</td>
                <td className="px-3 py-2.5 text-right font-mono text-foreground tabular-nums">{formatRupiah(s.revenue)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-foreground tabular-nums">{formatNumber(s.qty)}</td>
                <td className="px-3 py-2.5 text-right text-foreground">{s.skus}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-[#00E273] bg-muted/20 font-semibold">
              <td className="px-3 py-2.5" colSpan={4}>TOTAL</td>
              <td className="px-3 py-2.5 text-right font-mono text-foreground tabular-nums">{formatRupiah(totals.revenue)}</td>
              <td className="px-3 py-2.5 text-right font-mono text-foreground tabular-nums">{formatNumber(totals.qty)}</td>
              <td className="px-3 py-2.5 text-right text-foreground">{totals.skus}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-[10px]">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-2.5 py-1.5 border border-border rounded-sm disabled:opacity-50 hover:bg-muted transition-colors"
        >
          Prev
        </button>
        <span className="text-muted-foreground">Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-2.5 py-1.5 border border-border rounded-sm disabled:opacity-50 hover:bg-muted transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
