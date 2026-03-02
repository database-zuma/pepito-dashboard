import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  try {
    let whereClause = "WHERE store_canonical IS NOT NULL";
    const params: unknown[] = [];

    if (year) {
      params.push(parseInt(year));
      whereClause += ` AND period_year = $${params.length}`;
    }
    if (month) {
      params.push(parseInt(month));
      whereClause += ` AND period_month = $${params.length}`;
    }

    // All stores with metrics
    const stores = await query<{
      store_name: string;
      region: string;
      store_type: string;
      revenue: string;
      qty: string;
      skus: string;
      invoices: string;
      avg_price: string;
    }>(
      `SELECT 
        store_canonical AS store_name,
        region,
        CASE 
          WHEN store_canonical ILIKE '%express%' THEN 'Express'
          WHEN store_canonical ILIKE '%market %' AND store_canonical NOT ILIKE '%supermarket%' 
               AND store_canonical NOT ILIKE '%fresh%' AND store_canonical NOT ILIKE '%gourmet%' THEN 'Market'
          WHEN store_canonical ILIKE '%supermarket%' THEN 'Supermarket'
          WHEN store_canonical ILIKE '%deli%' OR store_canonical ILIKE '%popular%' THEN 'Popular Deli'
          WHEN store_canonical ILIKE '%fresh%' THEN 'Fresh Market'
          WHEN store_canonical ILIKE '%gourmet%' THEN 'Gourmet Market'
          ELSE 'Other'
        END AS store_type,
        COALESCE(SUM(total_price), 0) AS revenue,
        COALESCE(SUM(quantity), 0) AS qty,
        COUNT(DISTINCT item_code) AS skus,
        COUNT(DISTINCT invoice_number) AS invoices,
        CASE WHEN SUM(quantity) > 0 
          THEN SUM(total_price) / SUM(quantity) 
          ELSE 0 END AS avg_price
      FROM core.pepito_sales
      ${whereClause}
      GROUP BY store_canonical, region
      ORDER BY revenue DESC`,
      params
    );

    // Store monthly breakdown (for sparklines / detail)
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

    // Group monthly data by store
    const monthlyByStore: Record<
      string,
      Array<{ period: string; revenue: number; qty: number }>
    > = {};
    for (const row of storeMonthly) {
      if (!monthlyByStore[row.store_name]) {
        monthlyByStore[row.store_name] = [];
      }
      monthlyByStore[row.store_name].push({
        period: row.period,
        revenue: parseFloat(row.revenue),
        qty: parseFloat(row.qty),
      });
    }

    return NextResponse.json({
      stores: stores.map((r) => ({
        storeName: r.store_name,
        region: r.region,
        storeType: r.store_type,
        revenue: parseFloat(r.revenue),
        qty: parseFloat(r.qty),
        skus: parseInt(r.skus),
        invoices: parseInt(r.invoices),
        avgPrice: parseFloat(r.avg_price),
        monthly: monthlyByStore[r.store_name] || [],
      })),
    });
  } catch (error) {
    console.error("Stores API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stores data" },
      { status: 500 }
    );
  }
}
