"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  BarChart3, Package, RefreshCw, X, ChevronDown, Check, Hash,
} from "lucide-react";
import { formatNumber, formatRupiah } from "@/lib/utils";
import type { OverviewData, StoreData, ProductData, CategoryBreakdown, SeriesBreakdown, TierBreakdown, FilterOptions, Tab } from "@/lib/types";
import KpiCards from "@/components/KpiCards";
import PeriodChart from "@/components/charts/PeriodChart";
import RegionPieChart from "@/components/charts/RegionPieChart";
import StoreTable from "@/components/StoreTable";
import GenderPieChart from "@/components/charts/GenderPieChart";
import TierBarChart from "@/components/charts/TierBarChart";
import SeriesBarChart from "@/components/charts/SeriesBarChart";
import ProductsTable from "@/components/ProductsTable";
import "@/lib/chart-config";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "executive", label: "Executive Summary", icon: BarChart3 },
  { id: "sku-chart", label: "SKU Chart", icon: Package },
  { id: "detail-kode", label: "Detail (Kode)", icon: Hash },
  { id: "detail-size", label: "Detail Size", icon: Hash },
];

interface Filters {
  year: string[];
  month: string[];
  region: string[];
  store: string[];
  gender: string[];
  series: string[];
  tier: string[];
  tipe: string[];
}

const EMPTY_FILTERS: Filters = {
  year: [], month: [], region: [], store: [],
  gender: [], series: [], tier: [], tipe: [],
};

function filtersToParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => {
    if (Array.isArray(v) && v.length > 0) p.set(k, v.join(","));
  });
  return p;
}

function countActive(f: Filters): number {
  return Object.values(f).filter(v => Array.isArray(v) && v.length > 0).length;
}

function MultiSelect({
  label, options, selected, onToggle, onClear, onSelectAll,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  onClear: () => void;
  onSelectAll: (all: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = search 
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase())) 
    : options;

  const allSelected = filtered.length > 0 && filtered.every(o => selected.includes(o));

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const labelText = selected.length === 0 ? label
    : selected.length === 1 ? selected[0]
    : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative flex-1 min-w-[90px]">
      <div className="flex flex-col gap-0.5">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className={`w-full inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-sm border bg-card text-card-foreground hover:bg-muted transition-colors whitespace-nowrap
            ${selected.length > 0 ? "border-[#00E273]" : "border-border"}`}
        >
          <span className="truncate">{labelText}</span>
          <ChevronDown className={`size-3.5 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] w-max max-w-[240px] rounded-sm border border-border bg-card shadow-lg">
          <div className="p-1.5 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs px-2 py-1 rounded-sm border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-[#00E273]"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length > 0 && (
              <button
                type="button"
                onClick={() => allSelected ? onClear() : onSelectAll(filtered)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors border-b border-border"
              >
                <span className={`size-4 rounded-sm flex items-center justify-center flex-shrink-0 border transition-colors ${allSelected ? "bg-[#00E273] border-[#00E273]" : "border-border bg-background"}`}>
                  {allSelected && <Check className="size-2.5 text-black stroke-[3]" />}
                </span>
                <span className="text-muted-foreground">Select All</span>
              </button>
            )}
            {selected.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors border-b border-border"
              >
                <X className="size-3" />
                Clear {label}
              </button>
            )}
            {filtered.map(opt => {
              const checked = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onToggle(opt)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-left"
                >
                  <span className={`size-4 rounded-sm flex items-center justify-center flex-shrink-0 border transition-colors ${checked ? "bg-[#00E273] border-[#00E273]" : "border-border bg-background"}`}>
                    {checked && <Check className="size-2.5 text-black stroke-[3]" />}
                  </span>
                  <span className="truncate">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("executive");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  const activeCount = countActive(filters);

  useEffect(() => {
    fetch("/api/pepito/filters")
      .then(r => r.json())
      .then(setFilterOptions)
      .catch(console.error);
  }, []);

  const toggleFilter = useCallback((key: keyof Filters, val: string) => {
    setFilters(prev => {
      const arr = prev[key];
      const next = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
      return { ...prev, [key]: next };
    });
  }, []);

  const setFilterArr = useCallback((key: keyof Filters, vals: string[]) => {
    setFilters(prev => ({ ...prev, [key]: vals }));
  }, []);

  const resetFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const setCurrentTab = useCallback((t: Tab) => {
    setTab(t);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", t);
    router.push(`/?${params.toString()}`);
  }, [router, searchParams]);

  const filterParams = filtersToParams(filters).toString();
  
  const { data: overviewData, isLoading: overviewLoading } = useSWR<OverviewData>(
    `/api/pepito/overview?${filterParams}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const { data: storesData, isLoading: storesLoading } = useSWR<{ stores: StoreData[] }>(
    `/api/pepito/stores?${filterParams}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  // Get detail param based on current tab
  const detailParam = (tab === "detail-size" || tab === "sku-chart") ? "size" : "kode";

  const { data: productsData, isLoading: productsLoading } = useSWR<{
    topProducts: ProductData[];
    categoryBreakdown: CategoryBreakdown[];
    seriesBreakdown: SeriesBreakdown[];
    tierBreakdown: TierBreakdown[];
    totalRevenue?: number;
    totalQty?: number;
  }>(
    `/api/pepito/products?${filterParams}&detail=${detailParam}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const loading = overviewLoading || storesLoading || productsLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 bg-[#00E273]" />
      <div className="max-w-7xl mx-auto flex flex-col gap-4 p-4 md:p-6">
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
                <span className="ml-2">({formatNumber(overviewData.freshness.totalRows)} rows)</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-3 p-3 bg-card border border-border rounded-sm">
            <MultiSelect label="YEAR" options={filterOptions?.years ?? []}
              selected={filters.year}
              onToggle={(v) => toggleFilter("year", v)}
              onClear={() => setFilterArr("year", [])}
              onSelectAll={(all) => setFilterArr("year", all)} />
            <MultiSelect label="MONTH" options={Array.from({ length: 12 }, (_, i) => String(i + 1))}
              selected={filters.month}
              onToggle={(v) => toggleFilter("month", v)}
              onClear={() => setFilterArr("month", [])}
              onSelectAll={(all) => setFilterArr("month", all)} />
            <MultiSelect label="REGION" options={filterOptions?.regions ?? []}
              selected={filters.region}
              onToggle={(v) => toggleFilter("region", v)}
              onClear={() => setFilterArr("region", [])}
              onSelectAll={(all) => setFilterArr("region", all)} />
            <MultiSelect label="STORE" options={filterOptions?.stores ?? []}
              selected={filters.store}
              onToggle={(v) => toggleFilter("store", v)}
              onClear={() => setFilterArr("store", [])}
              onSelectAll={(all) => setFilterArr("store", all)} />
            <MultiSelect label="GENDER" options={filterOptions?.genders ?? []}
              selected={filters.gender}
              onToggle={(v) => toggleFilter("gender", v)}
              onClear={() => setFilterArr("gender", [])}
              onSelectAll={(all) => setFilterArr("gender", all)} />
            <MultiSelect label="SERIES" options={filterOptions?.series ?? []}
              selected={filters.series}
              onToggle={(v) => toggleFilter("series", v)}
              onClear={() => setFilterArr("series", [])}
              onSelectAll={(all) => setFilterArr("series", all)} />
            <MultiSelect label="TIER" options={filterOptions?.tiers ?? []}
              selected={filters.tier}
              onToggle={(v) => toggleFilter("tier", v)}
              onClear={() => setFilterArr("tier", [])}
              onSelectAll={(all) => setFilterArr("tier", all)} />
            <MultiSelect label="TIPE" options={filterOptions?.tipes ?? []}
              selected={filters.tipe}
              onToggle={(v) => toggleFilter("tipe", v)}
              onClear={() => setFilterArr("tipe", [])}
              onSelectAll={(all) => setFilterArr("tipe", all)} />
            {activeCount > 0 && (
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] opacity-0 select-none">·</label>
                <button onClick={resetFilters}
                  className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground border border-border rounded-sm px-2.5 py-1.5 bg-muted/40 hover:bg-muted transition-colors">
                  <X className="w-3 h-3" />Reset ({activeCount})
                </button>
              </div>
            )}
          </div>
        </header>

        <nav className="flex flex-wrap gap-0.5 border-b-2 border-border pb-0">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setCurrentTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors ${ tab === t.id ? "text-foreground border-b-[3px] border-[#00E273] -mb-[2px] bg-card" : "text-muted-foreground hover:text-foreground hover:bg-muted/50 -mb-[2px] border-b-[3px] border-transparent"}`}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </nav>

        <main className="flex flex-col gap-4">
          {loading && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading data...</span>
            </div>
          )}

          {tab === "executive" && overviewData && !loading && (
            <div className="flex flex-col gap-4">
              <KpiCards metrics={overviewData.metrics} loading={overviewLoading} />
              
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
                <div className="flex flex-col gap-4">
                  <PeriodChart data={overviewData.monthlyTrend} loading={overviewLoading} />
                  <RegionPieChart data={overviewData.regionSplit} loading={overviewLoading} />
                </div>
                <div className="flex flex-col gap-4 h-full">
                  <div className="bg-card border border-border rounded-sm p-4 flex flex-col min-h-[560px]">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">Store Ranking by Revenue</h3>
                    <div className="overflow-y-auto flex-1">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-card">
                          <tr className="bg-muted/40 text-left border-b border-border">
                            <th className="px-2 py-2 font-semibold text-muted-foreground uppercase tracking-wider text-[9px]">#</th>
                            <th className="px-2 py-2 font-semibold text-muted-foreground uppercase tracking-wider text-[9px]">Store</th>
                            <th className="px-2 py-2 font-semibold text-muted-foreground uppercase tracking-wider text-[9px] text-right">Revenue</th>
                            <th className="px-2 py-2 font-semibold text-muted-foreground uppercase tracking-wider text-[9px] text-right">Qty</th>
                            <th className="px-2 py-2 font-semibold text-muted-foreground uppercase tracking-wider text-[9px] text-right">Region</th>
                          </tr>
                        </thead>
                        <tbody>
                          {storesData?.stores.map((s, i) => (
                            <tr key={s.storeName} className="border-t border-border/50 hover:bg-muted/30">
                              <td className="px-2 py-1.5 text-muted-foreground tabular-nums">{i + 1}</td>
                              <td className="px-2 py-1.5 text-foreground">{s.storeName}</td>
                              <td className="px-2 py-1.5 text-right font-mono text-foreground tabular-nums">{formatRupiah(s.revenue)}</td>
                              <td className="px-2 py-1.5 text-right font-mono text-foreground tabular-nums">{formatNumber(s.qty)}</td>
                              <td className="px-2 py-1.5 text-muted-foreground">{s.region}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {storesData?.stores && storesData.stores.length > 0 && (
                      <div className="border-t-2 border-[#00E273] bg-muted/40 font-semibold mt-auto pt-2">
                        <div className="grid grid-cols-5 gap-2 px-2 text-xs">
                          <span className="font-bold text-foreground">TOTAL</span>
                          <span></span>
                          <span className="text-right font-mono text-foreground tabular-nums">{formatRupiah(storesData.stores.reduce((sum, s) => sum + s.revenue, 0))}</span>
                          <span className="text-right font-mono text-foreground tabular-nums">{formatNumber(storesData.stores.reduce((sum, s) => sum + s.qty, 0))}</span>
                          <span></span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "sku-chart" && productsData && !loading && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GenderPieChart data={productsData.categoryBreakdown} loading={productsLoading} />
                <TierBarChart data={productsData.tierBreakdown} loading={productsLoading} />
                <SeriesBarChart data={productsData.seriesBreakdown} loading={productsLoading} />
              </div>
            <ProductsTable data={productsData.topProducts} loading={productsLoading} totalRevenue={productsData.totalRevenue} totalQty={productsData.totalQty} />
            </div>
          )}

          {tab === "detail-kode" && productsData && !loading && (
            <ProductsTable data={productsData.topProducts} loading={productsLoading} totalRevenue={productsData.totalRevenue} totalQty={productsData.totalQty} />
          )}

          {tab === "detail-size" && productsData && !loading && (
            <ProductsTable data={productsData.topProducts} loading={productsLoading} totalRevenue={productsData.totalRevenue} totalQty={productsData.totalQty} />
          )}
        </main>

        <footer className="text-[10px] text-muted-foreground pt-4 border-t border-border flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00E273]" />
          Zuma Indonesia · Pepito Consignment Analytics
        </footer>
      </div>
    </div>
  );
}

function DashboardWithSuspense() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>}>
      <Dashboard />
    </Suspense>
  );
}

export default DashboardWithSuspense;
