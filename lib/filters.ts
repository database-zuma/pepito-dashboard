/**
 * Builds a parameterized WHERE clause from filter search params.
 * Returns { clause, params } where params is the growing array.
 */
export function buildPepitoWhere(
  searchParams: URLSearchParams,
  initialClause = "WHERE 1=1"
): { clause: string; params: unknown[] } {
  let clause = initialClause;
  const params: unknown[] = [];

  const push = (val: unknown) => {
    params.push(val);
    return params.length;
  };

  const getArr = (key: string): string[] => {
    const val = searchParams.get(key);
    return val ? val.split(",").map(v => v.trim()).filter(Boolean) : [];
  };

  const years = getArr("year").map(Number).filter(n => !isNaN(n));
  const months = getArr("month").map(Number).filter(n => !isNaN(n));
  const regions = getArr("region");
  const stores = getArr("store");
  const genders = getArr("gender");
  const series = getArr("series");
  const tiers = getArr("tier");
  const tipes = getArr("tipe");

  if (years.length) clause += ` AND period_year = ANY($${push(years)})`;
  if (months.length) clause += ` AND period_month = ANY($${push(months)})`;
  if (regions.length) clause += ` AND region = ANY($${push(regions)})`;
  if (stores.length) clause += ` AND store_canonical = ANY($${push(stores)})`;
  if (genders.length) clause += ` AND item_gender = ANY($${push(genders)})`;
  if (series.length) clause += ` AND item_seri = ANY($${push(series)})`;
  if (tiers.length) clause += ` AND item_tier = ANY($${push(tiers)})`;
  if (tipes.length) clause += ` AND item_tipe = ANY($${push(tipes)})`;

  return { clause, params };
}
