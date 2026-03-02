import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const store = searchParams.get("store");

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
    if (store) {
      params.push(store);
      whereClause += ` AND store_canonical = $${params.length}`;
    }

    // Top products by revenue
    const topProducts = await query<{
      item_code: string;
      item_name: string;
      revenue: string;
      qty: string;
      stores_sold: string;
      avg_price: string;
    }>(
      `SELECT 
        item_code,
        MAX(item_name) AS item_name,
        COALESCE(SUM(total_price), 0) AS revenue,
        COALESCE(SUM(quantity), 0) AS qty,
        COUNT(DISTINCT store_canonical) AS stores_sold,
        CASE WHEN SUM(quantity) > 0 
          THEN SUM(total_price) / SUM(quantity) 
          ELSE 0 END AS avg_price
      FROM core.pepito_sales
      ${whereClause}
      GROUP BY item_code
      ORDER BY revenue DESC
      LIMIT 50`,
      params
    );

    // Product category breakdown (based on item_name patterns)
    const categoryBreakdown = await query<{
      category: string;
      revenue: string;
      qty: string;
      skus: string;
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
      ${whereClause}
      GROUP BY category
      ORDER BY revenue DESC`,
      params
    );

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products data" },
      { status: 500 }
    );
  }
}
