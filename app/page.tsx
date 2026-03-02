"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3, Store, Package, RefreshCw, MapPin, DollarSign,
  ShoppingBag, Hash, Calendar, TrendingUp,
} from "lucide-react";
import { formatRupiah, formatNumber, formatRupiahFull } from "@/lib/utils";
import type { OverviewData, StoreData, ProductData, CategoryBreakdown } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import type { PieLabelRenderProps } from "recharts";


type Tab = "overview" | "stores" | "products";
const COLORS = ["#002A3A", "#00E273", "#0088FE", "#FF8042", "#FFBB28", "#8884d8", "#82ca9d", "#ffc658"];
const STORE_TYPE_COLORS: Record<string, string> = { Supermarket: "#002A3A", Market: "#00E273", Express: "#0088FE", "Popular Deli": "#FF8042", "Fresh Market": "#FFBB28", "Gourmet Market": "#8884d8", Other: "#82ca9d" };

function MetricCard({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 shadow-sm">
      <div className="p-2.5 bg-[#002A3A]/5 rounded-lg"><Icon className="w-5 h-5 text-[#002A3A]" /></div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function LoadingState() {
  return (<div className="flex items-center justify-center h-64 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mr-2" /><span>Loading data...</span></div>);
}

function ErrorState({ message }: { message: string }) {
  return (<div className="flex items-center justify-center h-64 text-red-400"><p>{message}</p></div>);
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (<p key={i} style={{ color: p.color }}>{p.name}: {p.name.toLowerCase().includes("revenue") ? formatRupiahFull(p.value) : formatNumber(p.value)}</p>))}
    </div>
  );
}

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

  const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#002A3A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Pepito Sales Dashboard</h1>
              <p className="text-sm text-white/60 mt-0.5">PT Sentral Retailindo Dewata — Per-Store Consignment</p>
            </div>
            {overviewData?.freshness && (
              <div className="text-right text-xs text-white/50">
                <p>Data: {overviewData.freshness.earliestDate} → {overviewData.freshness.latestDate}</p>
                <p>{formatNumber(overviewData.freshness.totalRows)} rows</p>
              </div>
            )}
          </div>
          <nav className="flex gap-1 mt-4">
            {([{ id: "overview" as Tab, label: "Overview", icon: BarChart3 }, { id: "stores" as Tab, label: "Stores", icon: Store }, { id: "products" as Tab, label: "Products", icon: Package }]).map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === t.id ? "bg-gray-50 text-[#002A3A]" : "text-white/70 hover:text-white hover:bg-white/10"}`}>
                <t.icon className="w-4 h-4" />{t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select value={year} onChange={(e) => setYear(e.target.value)} className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#002A3A]/20">
            <option value="">All Years</option>
            {filterYears.map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#002A3A]/20">
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (<option key={m} value={m}>{MONTH_NAMES[m]}</option>))}
          </select>
          <button onClick={() => { setYear(""); setMonth(""); }} className="text-xs text-gray-400 hover:text-gray-600 ml-1">Reset</button>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {error ? <ErrorState message={error} /> : loading ? <LoadingState /> : tab === "overview" && overviewData ? <OverviewTab data={overviewData} /> : tab === "stores" && storesData ? <StoresTab stores={storesData} /> : tab === "products" && productsData ? <ProductsTab products={productsData.topProducts} categories={productsData.categoryBreakdown} /> : <LoadingState />}
      </main>
    </div>
  );
}

function OverviewTab({ data }: { data: OverviewData }) {
  const { metrics, monthlyTrend, topStores, regionSplit } = data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={DollarSign} label="Total Revenue" value={formatRupiah(metrics.totalRevenue)} />
        <MetricCard icon={ShoppingBag} label="Pairs Sold" value={formatNumber(metrics.totalQty)} />
        <MetricCard icon={Store} label="Active Stores" value={metrics.totalStores.toString()} sub={`${metrics.totalInvoices} invoices`} />
        <MetricCard icon={Hash} label="SKUs Sold" value={formatNumber(metrics.totalSkus)} sub={`Avg ${formatRupiah(metrics.avgRevenuePerStore)}/store`} />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Monthly Revenue Trend</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatRupiah(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#002A3A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Store className="w-4 h-4" /> Top 10 Stores by Revenue</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topStores} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" fontSize={11} tickFormatter={(v) => formatRupiah(v)} />
                <YAxis type="category" dataKey="storeName" width={140} fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#00E273" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4" /> Bali vs Lombok</h3>
          <div className="h-72 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={regionSplit} cx="50%" cy="50%" outerRadius={100} dataKey="revenue" nameKey="region" label={(props: PieLabelRenderProps) => `${props.name || ''} (${((props.percent || 0) * 100).toFixed(0)}%)`} labelLine={false}>
                  {regionSplit.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value) => formatRupiahFull(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {regionSplit.map((r) => (
              <div key={r.region} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">{r.region}</p>
                <p className="font-bold text-gray-900">{formatRupiah(r.revenue)}</p>
                <p className="text-xs text-gray-400">{r.stores} stores · {formatNumber(r.qty)} prs</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Store Types</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="revenue" nameKey="type" label={(props: PieLabelRenderProps) => `${props.name || ''}`} labelLine={false}>
                  {typeBreakdown.map((entry) => (<Cell key={entry.type} fill={STORE_TYPE_COLORS[entry.type] || COLORS[0]} />))}
                </Pie>
                <Tooltip formatter={(value) => formatRupiahFull(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">All Stores — Revenue Ranking</h3>
            <div className="flex gap-1">
              {(["revenue", "qty", "avgPrice"] as const).map((key) => (
                <button key={key} onClick={() => setSortBy(key)} className={`text-xs px-2.5 py-1 rounded-md ${sortBy === key ? "bg-[#002A3A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {key === "revenue" ? "Revenue" : key === "qty" ? "Qty" : "Avg Price"}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[400px] overflow-y-auto">
            <ResponsiveContainer width="100%" height={sorted.length * 28 + 20}>
              <BarChart data={sorted} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" fontSize={10} tickFormatter={(v) => sortBy === "revenue" ? formatRupiah(v) : formatNumber(v)} />
                <YAxis type="category" dataKey="storeName" width={160} fontSize={9} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey={sortBy} name={sortBy === "revenue" ? "Revenue" : sortBy === "qty" ? "Qty" : "Avg Price"} fill="#002A3A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Store Detail ({stores.length} stores)</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">#</th>
              <th className="px-4 py-3 font-medium text-gray-500">Store</th>
              <th className="px-4 py-3 font-medium text-gray-500">Region</th>
              <th className="px-4 py-3 font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">Revenue</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">Pairs</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">SKUs</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">Avg Price</th>
            </tr></thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr key={s.storeName} className={`border-t border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/30`}>
                  <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{s.storeName}</td>
                  <td className="px-4 py-2.5"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.region === "Lombok" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"}`}>{s.region}</span></td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">{s.storeType}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-gray-900">{formatRupiahFull(s.revenue)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-gray-700">{formatNumber(s.qty)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{s.skus}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-gray-600">{formatRupiahFull(s.avgPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductsTab({ products, categories }: { products: ProductData[]; categories: CategoryBreakdown[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Category Revenue Split</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categories} cx="50%" cy="50%" outerRadius={90} dataKey="revenue" nameKey="category" label={(props: PieLabelRenderProps) => `${props.name || ''} (${((props.percent || 0) * 100).toFixed(0)}%)`} labelLine={false}>
                  {categories.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value) => formatRupiahFull(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Category Qty (Pairs)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => formatNumber(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="qty" name="Qty" fill="#00E273" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Top 50 Products by Revenue</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">#</th>
              <th className="px-4 py-3 font-medium text-gray-500">Code</th>
              <th className="px-4 py-3 font-medium text-gray-500">Product Name</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">Revenue</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">Pairs</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">Stores</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">Avg Price</th>
            </tr></thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.itemCode} className={`border-t border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/30`}>
                  <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{p.itemCode}</td>
                  <td className="px-4 py-2.5 text-gray-900 max-w-xs truncate">{p.itemName}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-gray-900">{formatRupiahFull(p.revenue)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-gray-700">{formatNumber(p.qty)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{p.storesSold}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-gray-600">{formatRupiahFull(p.avgPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}