"use client";

import { useState } from "react";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import type { ProductData } from "@/lib/types";

interface ProductsTableProps {
  data?: ProductData[];
  loading?: boolean;
}

export default function ProductsTable({ data, loading }: ProductsTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  if (loading || !data) {
    return <div className="h-80 bg-muted animate-pulse rounded-sm" />;
  }

  const totalPages = Math.ceil(data.length / pageSize);
  const paged = data.slice((page - 1) * pageSize, page * pageSize);
  const totals = data.reduce(
    (acc, p) => ({ revenue: acc.revenue + p.revenue, qty: acc.qty + p.qty }),
    { revenue: 0, qty: 0 }
  );

  const handleExport = () => {
    exportToCSV(
      data.map((p) => ({
        Code: p.itemCode,
        Product: p.itemName,
        Revenue: p.revenue,
        Pairs: p.qty,
        Stores: p.storesSold,
        AvgPrice: p.avgPrice,
      })),
      "pepito-products"
    );
  };

  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Top Products</h3>
        <button onClick={handleExport} className="text-[10px] px-2 py-1 border border-border rounded-sm hover:bg-muted transition-colors">
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/40 text-left border-b border-border">
              <th className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[9px]">#</th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[9px]">Code</th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[9px]">Product Name</th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[9px] text-right">Revenue</th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[9px] text-right">Pairs</th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[9px] text-right">Stores</th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-warker text-[9px] text-right">Avg Price</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((p, i) => (
              <tr key={p.itemCode} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5 text-muted-foreground tabular-nums">{(page - 1) * pageSize + i + 1}</td>
                <td className="px-3 py-2.5 font-mono text-muted-foreground">{p.itemCode}</td>
                <td className="px-3 py-2.5 text-foreground max-w-xs truncate">{p.itemName}</td>
                <td className="px-3 py-2.5 text-right font-mono text-foreground tabular-nums">{formatRupiah(p.revenue)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-foreground tabular-nums">{formatNumber(p.qty)}</td>
                <td className="px-3 py-2.5 text-right text-foreground">{p.storesSold}</td>
                <td className="px-3 py-2.5 text-right font-mono text-muted-foreground tabular-nums">{formatRupiah(p.avgPrice)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-[#00E273] bg-muted/20 font-semibold">
              <td className="px-3 py-2.5" colSpan={3}>TOTAL</td>
              <td className="px-3 py-2.5 text-right font-mono text-foreground tabular-nums">{formatRupiah(totals.revenue)}</td>
              <td className="px-3 py-2.5 text-right font-mono text-foreground tabular-nums">{formatNumber(totals.qty)}</td>
              <td className="px-3 py-2.5"></td>
              <td className="px-3 py-2.5"></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-[10px]">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2.5 py-1.5 border border-border rounded-sm disabled:opacity-50 hover:bg-muted transition-colors">Prev</button>
        <span className="text-muted-foreground">Page {page} of {totalPages}</span>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2.5 py-1.5 border border-border rounded-sm disabled:opacity-50 hover:bg-muted transition-colors">Next</button>
      </div>
    </div>
  );
}
