import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  try {
    let whereClause = "WHERE 1=1";
    const params: unknown[] = [];

    if (year) {
      params.push(parseInt(year));
      whereClause += ` AND period_year = $${params.length}`;
    }
    if (month) {
      params.push(parseInt(month));
      whereClause += ` AND period_month = $${params.length}`;
    }

    // Overview metrics
    const [metrics] = await query<{
      total_revenue: string;
      total_qty: string;
      total_invoices: string;
      total_stores: string;
      total_skus: string;
      avg_revenue_per_store: string;
    }>(
      `SELECT 
        COALESCE(SUM(total_price), 0) AS total_revenue,
        COALESCE(SUM(quantity), 0) AS total_qty,
        COUNT(DISTINCT invoice_number) AS total_invoices,
        COUNT(DISTINCT store_canonical) AS total_stores,
        COUNT(DISTINCT item_code) AS total_skus,
        CASE WHEN COUNT(DISTINCT store_canonical) > 0 
          THEN COALESCE(SUM(total_price), 0) / COUNT(DISTINCT store_canonical) 
          ELSE 0 END AS avg_revenue_per_store
      FROM core.pepito_sales ${whereClause}`,
      params
    );

    // Monthly trend
    const monthlyTrend = await query<{
      period: string;
      revenue: string;
      qty: string;
      stores: string;
    }>(
      `SELECT 
        period_year || '-' || LPAD(period_month::text, 2, '0') AS period,
        COALESCE(SUM(total_price), 0) AS revenue,
        COALESCE(SUM(quantity), 0) AS qty,
        COUNT(DISTINCT store_canonical) AS stores
      FROM core.pepito_sales
      WHERE period_year IS NOT NULL AND period_month IS NOT NULL
      GROUP BY period_year, period_month
      ORDER BY period_year, period_month`
    );

    // Top 10 stores by revenue
    const topStores = await query<{
      store_name: string;
      revenue: string;
      qty: string;
      skus: string;
    }>(
      `SELECT 
        store_canonical AS store_name,
        COALESCE(SUM(total_price), 0) AS revenue,
        COALESCE(SUM(quantity), 0) AS qty,
        COUNT(DISTINCT item_code) AS skus
      FROM core.pepito_sales
      ${whereClause} AND store_canonical IS NOT NULL
      GROUP BY store_canonical
      ORDER BY revenue DESC
      LIMIT 10`,
      params
    );

    // Region split (Bali vs Lombok)
    const regionSplit = await query<{
      region: string;
      revenue: string;
      qty: string;
      stores: string;
    }>(
      `SELECT 
        region,
        COALESCE(SUM(total_price), 0) AS revenue,
        COALESCE(SUM(quantity), 0) AS qty,
        COUNT(DISTINCT store_canonical) AS stores
      FROM core.pepito_sales
      ${whereClause} AND store_canonical IS NOT NULL
      GROUP BY region
      ORDER BY revenue DESC`,
      params
    );

    // Data freshness
    const [freshness] = await query<{
      latest_date: string;
      earliest_date: string;
      total_rows: string;
    }>(
      `SELECT 
        MAX(invoice_date)::text AS latest_date,
        MIN(invoice_date)::text AS earliest_date,
        COUNT(*) AS total_rows
      FROM core.pepito_sales`
    );

    return NextResponse.json({
      metrics: {
        totalRevenue: parseFloat(metrics.total_revenue),
        totalQty: parseFloat(metrics.total_qty),
        totalInvoices: parseInt(metrics.total_invoices),
        totalStores: parseInt(metrics.total_stores),
        totalSkus: parseInt(metrics.total_skus),
        avgRevenuePerStore: parseFloat(metrics.avg_revenue_per_store),
      },
      monthlyTrend: monthlyTrend.map((r) => ({
        period: r.period,
        revenue: parseFloat(r.revenue),
        qty: parseFloat(r.qty),
        stores: parseInt(r.stores),
      })),
      topStores: topStores.map((r) => ({
        storeName: r.store_name,
        revenue: parseFloat(r.revenue),
        qty: parseFloat(r.qty),
        skus: parseInt(r.skus),
      })),
      regionSplit: regionSplit.map((r) => ({
        region: r.region,
        revenue: parseFloat(r.revenue),
        qty: parseFloat(r.qty),
        stores: parseInt(r.stores),
      })),
      freshness: {
        latestDate: freshness?.latest_date || null,
        earliestDate: freshness?.earliest_date || null,
        totalRows: parseInt(freshness?.total_rows || "0"),
      },
    });
  } catch (error) {
    console.error("Overview API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch overview data" },
      { status: 500 }
    );
  }
}
