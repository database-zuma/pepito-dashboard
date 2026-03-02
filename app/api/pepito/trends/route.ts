import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Store-level monthly trends for heatmap
    const storeMonthly = await query<{
      store_name: string;
      period: string;
      revenue: string;
      qty: string;
    }>(
      `SELECT 
        store_canonical AS store_name,
        period_year || '-' || LPAD(period_month::text, 2, '0') AS period,
        COALESCE(SUM(total_price), 0) AS revenue,
        COALESCE(SUM(quantity), 0) AS qty
      FROM core.pepito_sales
      WHERE store_canonical IS NOT NULL AND period_year IS NOT NULL
      GROUP BY store_canonical, period_year, period_month
      ORDER BY store_canonical, period_year, period_month`
    );

    // YoY comparison (same month, different years)
    const yoyData = await query<{
      period_month: string;
      period_year: string;
      revenue: string;
      qty: string;
      stores: string;
    }>(
      `SELECT 
        period_month::text,
        period_year::text,
        COALESCE(SUM(total_price), 0) AS revenue,
        COALESCE(SUM(quantity), 0) AS qty,
        COUNT(DISTINCT store_name) AS stores
      FROM core.pepito_sales
      WHERE period_year IS NOT NULL AND period_month IS NOT NULL
      GROUP BY period_year, period_month
      ORDER BY period_month, period_year`
    );

    // Available filter options
    const filterOptions = await query<{
      years: string;
      months: string;
    }>(
      `SELECT 
        json_agg(DISTINCT period_year ORDER BY period_year)::text AS years,
        json_agg(DISTINCT period_month ORDER BY period_month)::text AS months
      FROM core.pepito_sales
      WHERE period_year IS NOT NULL`
    );

    return NextResponse.json({
      storeMonthly: storeMonthly.map((r) => ({
        storeName: r.store_name,
        period: r.period,
        revenue: parseFloat(r.revenue),
        qty: parseFloat(r.qty),
      })),
      yoyData: yoyData.map((r) => ({
        month: parseInt(r.period_month),
        year: parseInt(r.period_year),
        revenue: parseFloat(r.revenue),
        qty: parseFloat(r.qty),
        stores: parseInt(r.stores),
      })),
      filterOptions: {
        years: filterOptions[0]?.years
          ? JSON.parse(filterOptions[0].years)
          : [],
        months: filterOptions[0]?.months
          ? JSON.parse(filterOptions[0].months)
          : [],
      },
    });
  } catch (error) {
    console.error("Trends API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trends data" },
      { status: 500 }
    );
  }
}
