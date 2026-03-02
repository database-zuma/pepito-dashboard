"use client";

import { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import type { MonthlyTrend } from "@/lib/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

interface PeriodChartProps {
  data?: MonthlyTrend[];
  loading?: boolean;
}

export default function PeriodChart({ data, loading }: PeriodChartProps) {
  const chartRef = useRef<ChartJS>(null);

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
    labels: data.map((d) => d.period),
    datasets: [
      {
        type: "bar" as const,
        label: "Revenue",
        data: data.map((d) => d.revenue),
        backgroundColor: "#00E273",
        borderRadius: 1,
        yAxisID: "y",
      },
      {
        type: "line" as const,
        label: "Pairs",
        data: data.map((d) => d.qty),
        borderColor: "#002A3A",
        backgroundColor: "#002A3A",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 2,
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { position: "bottom" as const, labels: { boxWidth: 12, padding: 15, font: { size: 10 } } },
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
            return ctx.dataset.label + ": " + (ctx.dataset.type === "bar" ? `Rp ${val.toLocaleString()}` : val.toLocaleString());
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: {
        position: "left" as const,
        title: { display: true, text: "Revenue (Rp)", font: { size: 10 } },
        grid: { color: "#e5e7eb" },
        ticks: { font: { size: 10 }, callback: (v: any) => `Rp ${(v / 1000000).toFixed(0)}M` },
      },
      y1: {
        position: "right" as const,
        title: { display: true, text: "Pairs", font: { size: 10 } },
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
    },
  };

  return (
    <div className="bg-card border border-border rounded-sm p-4">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">Sales Over Time</h3>
      <div className="h-56">
        <Chart ref={chartRef} type="bar" data={chartData} options={options} />
      </div>
    </div>
  );
}
