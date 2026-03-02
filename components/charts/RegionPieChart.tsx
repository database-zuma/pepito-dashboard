"use client";

import { useRef, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { PIE_COLORS } from "@/lib/chart-config";
import { formatRupiah } from "@/lib/utils";
import type { RegionSplit } from "@/lib/types";

ChartJS.register(ArcElement, Tooltip, Legend);

interface RegionPieChartProps {
  data?: RegionSplit[];
  loading?: boolean;
}

export default function RegionPieChart({ data, loading }: RegionPieChartProps) {
  const chartRef = useRef<ChartJS<"doughnut">>(null);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  if (loading || !data) {
    return <div className="h-56 bg-muted animate-pulse rounded-sm" />;
  }

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  const chartData = {
    labels: data.map((d) => d.region),
    datasets: [
      {
        data: data.map((d) => d.revenue),
        backgroundColor: PIE_COLORS.slice(0, data.length),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: { position: "right" as const, labels: { boxWidth: 12, padding: 10, font: { size: 10 } } },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#000",
        bodyColor: "#000",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 2,
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.raw;
            const pct = ((val / totalRevenue) * 100).toFixed(1);
            return `${ctx.label}: Rp ${val.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-card border border-border rounded-sm p-4">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">Sales by Region</h3>
      <div className="h-56 flex items-center justify-center">
        <Doughnut ref={chartRef} data={chartData} options={options} />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {data.map((r) => (
          <div key={r.region} className="text-center p-2 bg-muted/40 rounded-sm">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">{r.region}</p>
            <p className="font-bold text-foreground tabular-nums text-xs">{formatRupiah(r.revenue)}</p>
            <p className="text-[9px] text-muted-foreground">{r.stores} stores · {r.qty.toLocaleString()} prs</p>
          </div>
        ))}
      </div>
    </div>
  );
}
