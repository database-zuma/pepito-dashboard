"use client";

import { useRef, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import type { SeriesBreakdown } from "@/lib/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface SeriesBarChartProps {
  data?: SeriesBreakdown[];
  loading?: boolean;
}

export default function SeriesBarChart({ data, loading }: SeriesBarChartProps) {
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

  const top15 = data.slice(0, 15);

  const chartData = {
    labels: top15.map((d) => d.series.length > 12 ? d.series.slice(0, 12) + "..." : d.series),
    datasets: [
      {
        label: "Revenue",
        data: top15.map((d) => d.revenue),
        backgroundColor: "#00E273",
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
      tooltip: { backgroundColor: "#ffffff", titleColor: "#000", bodyColor: "#000", borderColor: "#e5e7eb", borderWidth: 1, padding: 10, cornerRadius: 2 },
    },
    scales: {
      x: { grid: { color: "#e5e7eb" }, ticks: { font: { size: 10 }, callback: (v: any) => `Rp ${(v / 1000000).toFixed(0)}M` } },
      y: { grid: { display: false }, ticks: { font: { size: 9 } } },
    },
  };

  return (
    <div className="bg-card border border-border rounded-sm p-4">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">By Series (Top 15)</h3>
      <div className="h-56">
        <Bar ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
}
