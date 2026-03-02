"use client";

import { useRef, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { PIE_COLORS } from "@/lib/chart-config";
import type { CategoryBreakdown } from "@/lib/types";

ChartJS.register(ArcElement, Tooltip, Legend);

interface GenderPieChartProps {
  data?: CategoryBreakdown[];
  loading?: boolean;
}

export default function GenderPieChart({ data, loading }: GenderPieChartProps) {
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

  const chartData = {
    labels: data.map((d) => d.category),
    datasets: [
      {
        data: data.map((d) => d.revenue),
        backgroundColor: PIE_COLORS.slice(0, data.length),
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "55%",
    plugins: {
      legend: { position: "right" as const, labels: { boxWidth: 10, padding: 8, font: { size: 9 } } },
      tooltip: { backgroundColor: "#ffffff", titleColor: "#000", bodyColor: "#000", borderColor: "#e5e7eb", borderWidth: 1, padding: 10, cornerRadius: 2 },
    },
  };

  return (
    <div className="bg-card border border-border rounded-sm p-4">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">By Gender</h3>
      <div className="h-48">
        <Doughnut ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
}
