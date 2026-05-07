import type { DecisionResult, Ratios } from "./types";

export function evaluateCompany(r: Ratios): DecisionResult {
  let score = 0;
  const flags: string[] = [];

  if (r.roe !== null) {
    if (r.roe >= 15) score += 2;
    else if (r.roe >= 8) score += 1;
    else flags.push("LOW_ROE");
  }
  if (r.current_ratio !== null) {
    if (r.current_ratio >= 2) score += 2;
    else if (r.current_ratio >= 1.2) score += 1;
    else flags.push("LIQUIDITY_RISK");
  }
  if (r.debt_to_equity !== null) {
    if (r.debt_to_equity <= 1) score += 2;
    else if (r.debt_to_equity <= 2) score += 1;
    else flags.push("HIGH_LEVERAGE");
  }
  if (r.revenue_growth !== null) {
    if (r.revenue_growth > 10) score += 2;
    else if (r.revenue_growth > 0) score += 1;
    else flags.push("DECLINING_REVENUE");
  }

  let verdict = "STABLE BUT MONITOR";
  if (score >= 7) verdict = "HEALTHY GROWTH COMPANY";
  else if (score < 4) verdict = "HIGH RISK — CAUTION";

  return { score, verdict, flags };
}

export function riskLevels(r: Ratios) {
  // 0..100 (higher = more risk)
  const lev = r.debt_to_equity !== null
    ? Math.min(100, Math.max(0, r.debt_to_equity * 35))
    : 50;
  const liq = r.current_ratio !== null
    ? Math.min(100, Math.max(0, 100 - r.current_ratio * 35))
    : 50;
  const sol = r.debt_ratio !== null
    ? Math.min(100, Math.max(0, r.debt_ratio * 130))
    : 50;
  const overall = Math.round((lev + liq + sol) / 3);
  return {
    leverage: Math.round(lev),
    liquidity: Math.round(liq),
    solvency: Math.round(sol),
    overall,
  };
}
