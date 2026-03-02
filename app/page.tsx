"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3, Store, Package, RefreshCw, MapPin, DollarSign,
  ShoppingBag, Hash, TrendingUp,
} from "lucide-react";
import { formatRupiah, formatNumber, formatRupiahFull } from "@/lib/utils";
import type { OverviewData, StoreData, ProductData, CategoryBreakdown } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import type { PieLabelRenderProps } from "recharts";

type Tab = "overview" | "stores" | "products";
const COLORS = ["#002A3A", "#00E273", "#4A7C8F", "#6BAE9E", "#A8D5C2", "#8884d8", "#82ca9d", "#ffc658"];
const STORE_TYPE_COLORS: Record<string, string> = {
  Supermarket: "#002A3A", Market: "#00E273", Express: "#4A7C8F",
  "Popular Deli": "#6BAE9E", "Fresh Market": "#A8D5C2", "Gourmet Market": "#8884d8", Other: "#82ca9d",
};

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "stores", label: "Stores", icon: Store },
  { id: "products", label: "Products", icon: Package },
];

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ── Metric Card ─────────────────────────────────────────── */
function MetricCard({ icon: Icon, label, value, sub }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string;
}) {
  return (
    <div className="bg-card border border-border p-4 flex items-start gap-3">
      <div className="p-2 bg-muted rounded-sm">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-foreground mt-0.5 tabular-nums">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ── States ──────────────────────────────────────────────── */
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      <RefreshCw className="w-5 h-5 animate-spin mr-2" />
      <span className="text-sm">Loading data...</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-64 text-destructive">
      <p className="text-sm">{message}</p>
    </div>
  );
}

/* ── Chart Tooltip ───────────────────────────────────────── */
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-sm p-3 text-sm shadow-md">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="tabular-nums">
          {p.name}: {p.name.toLowerCase().includes("revenue") || p.name.toLowerCase().includes("avg price")
            ? formatRupiahFull(p.value)
            : formatNumber(p.value)}
        </p>
      ))}
    </div>
  );
}

/* ── Section Header ──────────────────────────────────────── */
function SectionHeader({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</h3>
    </div>
  );
}

/* ── Dashboard Shell ─────────────────────────────────────── */
export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [storesData, setStoresData] = useState<StoreData[] | null>(null);
  const [productsData, setProductsData] = useState<{ topProducts: ProductData[]; categoryBreakdown: CategoryBreakdown[] } | null>(null);
  const [year, setYear] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterYears, setFilterYears] = useState<number[]>([]);

  const fetchOverview = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (year) params.set("year", year);
      if (month) params.set("month", month);
      const res = await fetch(`/api/pepito/overview?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOverviewData(data);
      if (data.monthlyTrend?.length > 0) {
        const years = [...new Set(data.monthlyTrend.map((t: { period: string }) => parseInt(t.period.split("-")[0])))] as number[];
        setFilterYears(years.sort());
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Unknown error"); }
    finally { setLoading(false); }
  }, [year, month]);

  const fetchStores = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (year) params.set("year", year);
      if (month) params.set("month", month);
      const res = await fetch(`/api/pepito/stores?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStoresData(data.stores);
    } catch (e) { setError(e instanceof Error ? e.message : "Unknown error"); }
    finally { setLoading(false); }
  }, [year, month]);

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (year) params.set("year", year);
      if (month) params.set("month", month);
      const res = await fetch(`/api/pepito/products?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProductsData(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Unknown error"); }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => {
    if (tab === "overview") fetchOverview();
    else if (tab === "stores") fetchStores();
    else if (tab === "products") fetchProducts();
  }, [tab, fetchOverview, fetchStores, fetchProducts]);

  return (
    <div className="min-h-screen bg-background">
      {/* Top accent bar */}
      <div className="h-1 bg-[#00E273]" />

      <div className="max-w-7xl mx-auto flex flex-col gap-4 p-4 md:p-6">
        {/* Header */}
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 bg-[#00E273] rounded-full" />
              <div>
                <h1 className="text-lg font-semibold text-foreground tracking-tight">Pepito Sales Dashboard</h1>
                <p className="text-[11px] text-muted-foreground">PT Sentral Retailindo Dewata · Consignment</p>
              </div>
            </div>
            {overviewData?.freshness && (
              <span className="text-[10px] text-muted-foreground tabular-nums bg-muted/60 px-2.5 py-1 rounded-sm border border-border">
                Data:{" "}
                <span className="font-semibold text-foreground">
                  {overviewData.freshness.earliestDate} → {overviewData.freshness.latestDate}
                </span>
                <span className="ml-2 text-muted-foreground">({formatNumber(overviewData.freshness.totalRows)} rows)</span>
              </span>
            )}
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-2">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="text-xs border border-border rounded-sm px-2.5 py-1.5 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-[#00E273]/40"
            >
              <option value="">All Years</option>
              {filterYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-xs border border-border rounded-sm px-2.5 py-1.5 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-[#00E273]/40"
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{MONTH_NAMES[m]}</option>
              ))}
            </select>
            {(year || month) && (
              <button
                onClick={() => { setYear(""); setMonth(""); }}
                className="text-[11px] text-muted-foreground hover:text-foreground border border-border rounded-sm px-2 py-1.5 bg-card transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </header>

        {/* Tab nav */}
        <nav className="flex flex-wrap gap-0.5 border-b-2 border-border pb-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors
                ${tab === t.id
                  ? "text-foreground border-b-[3px] border-[#00E273] -mb-[2px] bg-card"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 -mb-[2px] border-b-[3px] border-transparent"
                }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex flex-col gap-4">
          {error
            ? <ErrorState message={error} />
            : loading
            ? <LoadingState />
            : tab === "overview" && overviewData
            ? <OverviewTab data={overviewData} />
            : tab === "stores" && storesData
            ? <StoresTab stores={storesData} />
            : tab === "products" && productsData
            ? <ProductsTab products={productsData.topProducts} categories={productsData.categoryBreakdown} />
            : <LoadingState />}
        </main>

        {/* Footer */}
        <footer className="text-[10px] text-muted-foreground pt-4 border-t border-border flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00E273]" />
          Zuma Indonesia · Pepito Consignment Analytics
        </footer>
      </div>
    </div>
  );
}

/* ── Overview Tab ────────────────────────────────────────── */
function OverviewTab({ data }: { data: OverviewData }) {
  const { metrics, monthlyTrend, topStores, regionSplit } = data;
  return (
    <div className="flex flex-col gap-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={DollarSign} label="Total Revenue" value={formatRupiah(metrics.totalRevenue)} />
        <MetricCard icon={ShoppingBag} label="Pairs Sold" value={formatNumber(metrics.totalQty)} />
        <MetricCard icon={Store} label="Active Stores" value={metrics.totalStores.toString()} sub={`${metrics.totalInvoices} invoices`} />
        <MetricCard icon={Hash} label="SKUs Sold" value={formatNumber(metrics.totalSkus)} sub={`Avg ${formatRupiah(metrics.avgRevenuePerStore)}/store`} />
      </div>

      {/* Monthly trend */}
      <div className="bg-card border border-border p-4">
        <SectionHeader icon={TrendingUp} label="Monthly Revenue Trend" />
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="period" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatRupiah(v)} tick={{ fill: "var(--muted-foreground)" }} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#002A3A" radius={[1, 1, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top stores + Region split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border p-4">
          <SectionHeader icon={Store} label="Top 10 Stores by Revenue" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topStores} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" fontSize={10} tickFormatter={(v) => formatRupiah(v)} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} />
                <YAxis type="category" dataKey="storeName" width={140} fontSize={9} tickLine={false} tick={{ fill: "var(--muted-foreground)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#00E273" radius={[0, 1, 1, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border p-4">
          <SectionHeader icon={MapPin} label="Bali vs Lombok" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionSplit}
                  cx="50%" cy="50%"
                  outerRadius={90}
                  dataKey="revenue"
                  nameKey="region"
                  label={(props: PieLabelRenderProps) => `${props.name || ''} (${((props.percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {regionSplit.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatRupiahFull(Number(value))} />
                <Legend iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {regionSplit.map((r) => (
              <div key={r.region} className="text-center p-3 bg-muted/40 border border-border rounded-sm">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{r.region}</p>
                <p className="font-bold text-foreground tabular-nums mt-0.5">{formatRupiah(r.revenue)}</p>
                <p className="text-[10px] text-muted-foreground">{r.stores} stores · {formatNumber(r.qty)} prs</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stores Tab ──────────────────────────────────────────── */
function StoresTab({ stores }: { stores: StoreData[] }) {
  const [sortBy, setSortBy] = useState<"revenue" | "qty" | "avgPrice">("revenue");
  const sorted = [...stores].sort((a, b) => b[sortBy] - a[sortBy]);
  const typeBreakdown = stores.reduce((acc, s) => {
    const existing = acc.find((a) => a.type === s.storeType);
    if (existing) { existing.revenue += s.revenue; existing.count += 1; }
    else { acc.push({ type: s.storeType, revenue: s.revenue, count: 1 }); }
    return acc;
  }, [] as Array<{ type: string; revenue: number; count: number }>);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Store type pie */}
        <div className="bg-card border border-border p-4">
          <SectionHeader icon={Store} label="Store Types" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeBreakdown}
                  cx="50%" cy="50%"
                  outerRadius={75}
                  dataKey="revenue"
                  nameKey="type"
                  label={(props: PieLabelRenderProps) => `${props.name || ''}`}
                  labelLine={false}
                >
                  {typeBreakdown.map((entry) => (
                    <Cell key={entry.type} fill={STORE_TYPE_COLORS[entry.type] || COLORS[0]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatRupiahFull(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Store ranking bar chart */}
        <div className="lg:col-span-2 bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <SectionHeader icon={BarChart3} label="All Stores — Revenue Ranking" />
            <div className="flex gap-1">
              {(["revenue", "qty", "avgPrice"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`text-[10px] font-semibold px-2 py-1 rounded-sm border transition-colors ${
                    sortBy === key
                      ? "bg-[#002A3A] text-white border-[#002A3A]"
                      : "bg-card text-muted-foreground border-border hover:border-foreground/30"
                  }`}
                >
                  {key === "revenue" ? "Revenue" : key === "qty" ? "Qty" : "Avg Price"}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[380px] overflow-y-auto">
            <ResponsiveContainer width="100%" height={sorted.length * 28 + 20}>
              <BarChart data={sorted} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" fontSize={9} tickFormatter={(v) => sortBy === "revenue" ? formatRupiah(v) : formatNumber(v)} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} />
                <YAxis type="category" dataKey="storeName" width={160} fontSize={9} tickLine={false} tick={{ fill: "var(--muted-foreground)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey={sortBy} name={sortBy === "revenue" ? "Revenue" : sortBy === "qty" ? "Qty" : "Avg Price"} fill="#002A3A" radius={[0, 1, 1, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Store table */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Store Detail ({stores.length} stores)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/40 text-left border-b border-border">
                <th className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">#</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Store</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Region</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Type</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] text-right">Revenue</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] text-right">Pairs</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] text-right">SKUs</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] text-right">Avg Price</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr
                  key={s.storeName}
                  className={`border-t border-border/50 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "bg-card" : "bg-muted/20"}`}
                >
                  <td className="px-4 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-foreground">{s.storeName}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-semibold border ${
                      s.region === "Lombok"
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                      {s.region}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{s.storeType}</td>
                  <td className="px-4 py-2 text-right font-mono text-foreground tabular-nums">{formatRupiahFull(s.revenue)}</td>
                  <td className="px-4 py-2 text-right font-mono text-foreground tabular-nums">{formatNumber(s.qty)}</td>
                  <td className="px-4 py-2 text-right text-foreground">{s.skus}</td>
                  <td className="px-4 py-2 text-right font-mono text-muted-foreground tabular-nums">{formatRupiahFull(s.avgPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Products Tab ────────────────────────────────────────── */
function ProductsTab({ products, categories }: { products: ProductData[]; categories: CategoryBreakdown[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category revenue pie */}
        <div className="bg-card border border-border p-4">
          <SectionHeader icon={Package} label="Category Revenue Split" />
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%" cy="50%"
                  outerRadius={90}
                  dataKey="revenue"
                  nameKey="category"
                  label={(props: PieLabelRenderProps) => `${props.name || ''} (${((props.percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatRupiahFull(Number(value))} />
                <Legend iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category qty bar */}
        <div className="bg-card border border-border p-4">
          <SectionHeader icon={ShoppingBag} label="Category Qty (Pairs)" />
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="category" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} tick={{ fill: "var(--muted-foreground)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="qty" name="Qty" fill="#00E273" radius={[1, 1, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Products table */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Top 50 Products by Revenue
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/40 text-left border-b border-border">
                <th className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">#</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Code</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Product Name</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] text-right">Revenue</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] text-right">Pairs</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] text-right">Stores</th>
                <th className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] text-right">Avg Price</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr
                  key={p.itemCode}
                  className={`border-t border-border/50 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "bg-card" : "bg-muted/20"}`}
                >
                  <td className="px-4 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                  <td className="px-4 py-2 font-mono text-muted-foreground">{p.itemCode}</td>
                  <td className="px-4 py-2 text-foreground max-w-xs truncate">{p.itemName}</td>
                  <td className="px-4 py-2 text-right font-mono text-foreground tabular-nums">{formatRupiahFull(p.revenue)}</td>
                  <td className="px-4 py-2 text-right font-mono text-foreground tabular-nums">{formatNumber(p.qty)}</td>
                  <td className="px-4 py-2 text-right text-foreground">{p.storesSold}</td>
                  <td className="px-4 py-2 text-right font-mono text-muted-foreground tabular-nums">{formatRupiahFull(p.avgPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
