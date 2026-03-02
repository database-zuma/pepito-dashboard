"use client";

import { useRef, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import type { TopStore } from "@/lib/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface StoreBarChartProps {
  data?: TopStore[];
  loading?: boolean;
}

export default function StoreBarChart({ data, loading }: StoreBarChartProps) {
  const chartRef = useRef<ChartJS<"bar">>(null);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  if (loading || !data) {
    return <div className="h-72 bg-muted animate-pulse rounded-sm" />;
  }

  const top10 = data.slice(0, 10);

  const chartData = {
    labels: top10.map((d) => d.storeName.length > 25 ? d.storeName.slice(0, 25) + "..." : d.storeName),
    datasets: [
      {
        label: "Revenue",
        data: top10.map((d) => d.revenue),
        backgroundColor: "#002A3A",
        borderRadius: 1,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#000",
        bodyColor: "#000",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 2,
        callbacks: {
          label: (ctx: any) => `Revenue: Rp ${ctx.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: { grid: { color: "#e5e7eb" }, ticks: { font: { size: 10 }, callback: (v: any) => `Rp ${(v / 1000000).toFixed(0)}M` } },
      y: { grid: { display: false }, ticks: { font: { size: 10 } } },
    },
  };

  return (
    <div className="bg-card border border-border rounded-sm p-4">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">Top 10 Stores</h3>
      <div className="h-72">
        <Bar ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
}
