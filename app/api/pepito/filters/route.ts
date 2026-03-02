import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [years, regions, stores, genders, series, tiers, tipes] = await Promise.all([
      query<{ v: string }>(
        `SELECT DISTINCT period_year::text AS v FROM core.pepito_sales
         WHERE period_year IS NOT NULL ORDER BY v`
      ),
      query<{ v: string }>(
        `SELECT DISTINCT region AS v FROM core.pepito_sales
         WHERE region IS NOT NULL ORDER BY v`
      ),
      query<{ v: string }>(
        `SELECT DISTINCT store_canonical AS v FROM core.pepito_sales
         WHERE store_canonical IS NOT NULL ORDER BY v`
      ),
      query<{ v: string }>(
        `SELECT DISTINCT item_gender AS v FROM core.pepito_sales
         WHERE item_gender IS NOT NULL ORDER BY v`
      ),
      query<{ v: string }>(
        `SELECT DISTINCT item_seri AS v FROM core.pepito_sales
         WHERE item_seri IS NOT NULL ORDER BY v`
      ),
      query<{ v: string }>(
        `SELECT DISTINCT item_tier AS v FROM core.pepito_sales
         WHERE item_tier IS NOT NULL ORDER BY v`
      ),
      query<{ v: string }>(
        `SELECT DISTINCT item_tipe AS v FROM core.pepito_sales
         WHERE item_tipe IS NOT NULL ORDER BY v`
      ),
    ]);

    return NextResponse.json({
      years: years.map((r) => r.v),
      regions: regions.map((r) => r.v),
      stores: stores.map((r) => r.v),
      genders: genders.map((r) => r.v),
      series: series.map((r) => r.v),
      tiers: tiers.map((r) => r.v),
      tipes: tipes.map((r) => r.v),
    });
  } catch (error) {
    console.error("Filters API error:", error);
    return NextResponse.json({ error: "Failed to fetch filters" }, { status: 500 });
  }
}
