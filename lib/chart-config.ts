"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  BarController,
  LineController,
  PieController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  BarController,
  LineController,
  PieController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const CHART_COLORS = {
  primary: "#00E273",
  secondary: "#002A3A",
  teal: "#4A7C8F",
  light: "#6BAE9E",
  pale: "#A8D5C2",
  gray: "#8884d8",
  accent: "#82ca9d",
  yellow: "#ffc658",
};

export const PIE_COLORS = [
  "#00E273",
  "#002A3A",
  "#4A4A4A",
  "#8C8C8C",
  "#C4C4C4",
  "#00B25A",
  "#1A5C6B",
  "#D4D4D4",
];

if (typeof window !== "undefined") {
  ChartJS.defaults.font.family = "Geist, system-ui, -apple-system, sans-serif";
  ChartJS.defaults.color = "#6b7280";
  ChartJS.defaults.plugins.tooltip.backgroundColor = "#ffffff";
  ChartJS.defaults.plugins.tooltip.titleColor = "#000000";
  ChartJS.defaults.plugins.tooltip.bodyColor = "#000000";
  ChartJS.defaults.plugins.tooltip.borderColor = "#e5e7eb";
  ChartJS.defaults.plugins.tooltip.borderWidth = 1;
  ChartJS.defaults.plugins.tooltip.padding = 12;
  ChartJS.defaults.plugins.tooltip.cornerRadius = 2;
}
