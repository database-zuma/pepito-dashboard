import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { buildPepitoWhere } from "@/lib/filters";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const detailType = searchParams.get("detail") || "kode"; // "kode" or "size"
  const { clause: where, params } = buildPepitoWhere(searchParams);

  // Determine grouping column based on detail type
  // Use COALESCE to handle NULL values so we don't lose data
  const groupCol = detailType === "size" ? "item_code" : "COALESCE(item_kode, item_code)";
  const codeCol = detailType === "size" ? "item_code" : "COALESCE(item_kode, item_code)";

  try {
    // Get total revenue for summary (not affected by grouping/LIMIT)
    const totalSummary = await query<{ total_revenue: string; total_qty: string }>(
      `SELECT 
        COALESCE(SUM(total_price), 0) AS total_revenue,
        COALESCE(SUM(quantity), 0) AS total_qty
       FROM core.pepito_sales
       ${where}`,
      params
    );

    const topProducts = await query<{
      item_code: string;
      item_name: string;
      revenue: string;
      qty: string;
      stores_sold: string;
      avg_price: string;
    }>(
      `SELECT 
        ${codeCol} AS item_code,
        MAX(item_name) AS item_name,
        COALESCE(SUM(total_price), 0) AS revenue,
        COALESCE(SUM(quantity), 0) AS qty,
        COUNT(DISTINCT store_canonical) AS stores_sold,
        CASE WHEN SUM(quantity) > 0 
          THEN SUM(total_price) / SUM(quantity) 
          ELSE 0 END AS avg_price
       FROM core.pepito_sales
       ${where}
       GROUP BY ${groupCol}
       ORDER BY revenue DESC
       LIMIT 50`,
      params
    );

    const categoryBreakdown = await query<{
      category: string; revenue: string; qty: string; skus: string;
    }>(
      `SELECT 
        CASE 
          WHEN item_gender = 'MEN' THEN 'Men'
          WHEN item_gender = 'LADIES' THEN 'Ladies'
          WHEN item_gender IN ('BABY', 'BOYS', 'GIRLS', 'JUNIOR', 'KIDS') THEN 'Baby & Kids'
          WHEN item_gender IS NULL THEN 'Other'
          ELSE INITCAP(item_gender)
        END AS category,
        COALESCE(SUM(total_price), 0) AS revenue,
        COALESCE(SUM(quantity), 0) AS qty,
        COUNT(DISTINCT item_code) AS skus
       FROM core.pepito_sales
       ${where}
       GROUP BY category
       ORDER BY revenue DESC`,
      params
    );

    // Series breakdown
    const seriesBreakdown = await query<{
      series: string; revenue: string; qty: string; skus: string;
    }>(
      `SELECT 
        COALESCE(item_seri, 'Unknown') AS series,
        COALESCE(SUM(total_price), 0) AS revenue,
        COALESCE(SUM(quantity), 0) AS qty,
        COUNT(DISTINCT item_code) AS skus
       FROM core.pepito_sales
       ${where} AND item_seri IS NOT NULL
       GROUP BY item_seri
       ORDER BY revenue DESC
       LIMIT 15`,
      params
    );

    // Tier breakdown
    const tierBreakdown = await query<{
      tier: string; revenue: string; qty: string; skus: string;
    }>(
      `SELECT 
        COALESCE(item_tier, 'Unknown') AS tier,
        COALESCE(SUM(total_price), 0) AS revenue,
        COALESCE(SUM(quantity), 0) AS qty,
        COUNT(DISTINCT item_code) AS skus
       FROM core.pepito_sales
       ${where} AND item_tier IS NOT NULL
       GROUP BY item_tier
       ORDER BY tier`,
      params
    );

    return NextResponse.json({

      totalRevenue: parseFloat(String(totalSummary[0]?.total_revenue || 0)),
      totalQty: parseFloat(String(totalSummary[0]?.total_qty || 0)),
      topProducts: topProducts.map((r) => ({
        itemCode: r.item_code,
        itemName: r.item_name,
        revenue: parseFloat(r.revenue),
        qty: parseFloat(r.qty),
        storesSold: parseInt(r.stores_sold),
        avgPrice: parseFloat(r.avg_price),
      })),
      categoryBreakdown: categoryBreakdown.map((r) => ({
        category: r.category,
        revenue: parseFloat(r.revenue),
        qty: parseFloat(r.qty),
        skus: parseInt(r.skus),
      })),
      seriesBreakdown: seriesBreakdown.map((r) => ({
        series: r.series,
        revenue: parseFloat(r.revenue),
        qty: parseFloat(r.qty),
        skus: parseInt(r.skus),
      })),
      tierBreakdown: tierBreakdown.map((r) => ({
        tier: r.tier,
        revenue: parseFloat(r.revenue),
        qty: parseFloat(r.qty),
        skus: parseInt(r.skus),
      })),
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: "Failed to fetch products data" }, { status: 500 });
  }
}
