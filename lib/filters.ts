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

  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const region = searchParams.get("region");
  const store = searchParams.get("store");
  const gender = searchParams.get("gender");
  const series = searchParams.get("series");
  const tier = searchParams.get("tier");
  const tipe = searchParams.get("tipe");

  if (year) clause += ` AND period_year = $${push(parseInt(year))}`;
  if (month) clause += ` AND period_month = $${push(parseInt(month))}`;
  if (region) clause += ` AND region = $${push(region)}`;
  if (store) clause += ` AND store_canonical = $${push(store)}`;
  if (gender) clause += ` AND item_gender = $${push(gender)}`;
  if (series) clause += ` AND item_seri = $${push(series)}`;
  if (tier) clause += ` AND item_tier = $${push(tier)}`;
  if (tipe) clause += ` AND item_tipe = $${push(tipe)}`;

  return { clause, params };
}
