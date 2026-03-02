"use client";

import { useRef, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import type { TierBreakdown } from "@/lib/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface TierBarChartProps {
  data?: TierBreakdown[];
  loading?: boolean;
}

export default function TierBarChart({ data, loading }: TierBarChartProps) {
  const chartRef = useRef<ChartJS<"bar">>(null);

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

  const chartData = {
    labels: data.map((d) => d.tier),
    datasets: [
      {
        label: "Revenue",
        data: data.map((d) => d.revenue),
        backgroundColor: "#002A3A",
        borderRadius: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: "#ffffff", titleColor: "#000", bodyColor: "#000", borderColor: "#e5e7eb", borderWidth: 1, padding: 10, cornerRadius: 2 },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: "#e5e7eb" }, ticks: { font: { size: 10 }, callback: (v: any) => `Rp ${(v / 1000000).toFixed(0)}M` } },
    },
  };

  return (
    <div className="bg-card border border-border rounded-sm p-4">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">By Tier</h3>
      <div className="h-48">
        <Bar ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
}
