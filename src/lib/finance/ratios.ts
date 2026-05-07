import type { FinancialPayload, Ratios } from "./types";

const safe = (n: number | undefined, d: number | undefined) =>
  !n || !d || d === 0 ? null : n / d;

export function calculateRatios(p: FinancialPayload): Ratios {
  const i = p.income_statement;
  const b = p.balance_sheet;
  const gp = i.gross_profit ?? (i.revenue - (i.cost_of_goods_sold ?? 0));

  const roe = safe(i.net_income, b.total_equity);
  const roa = safe(i.net_income, b.total_assets);
  const npm = safe(i.net_income, i.revenue);
  const gpm = safe(gp, i.revenue);
  const cr = safe(b.current_assets, b.current_liabilities);
  const qr = safe(
    b.current_assets - (b.inventory ?? 0),
    b.current_liabilities,
  );
  const dte = safe(b.total_liabilities, b.total_equity);
  const dr = safe(b.total_liabilities, b.total_assets);
  const growth =
    p.previous_revenue && p.previous_revenue > 0
      ? (i.revenue - p.previous_revenue) / p.previous_revenue
      : null;

  return {
    roe: roe !== null ? roe * 100 : null,
    roa: roa !== null ? roa * 100 : null,
    net_profit_margin: npm !== null ? npm * 100 : null,
    gross_profit_margin: gpm !== null ? gpm * 100 : null,
    current_ratio: cr,
    quick_ratio: qr,
    debt_to_equity: dte,
    debt_ratio: dr,
    revenue_growth: growth !== null ? growth * 100 : null,
  };
}

export type Health = "good" | "warn" | "bad" | "neutral";

export function classify(metric: keyof Ratios, value: number | null): Health {
  if (value === null || Number.isNaN(value)) return "neutral";
  switch (metric) {
    case "roe":
      return value > 15 ? "good" : value >= 8 ? "warn" : "bad";
    case "roa":
      return value > 10 ? "good" : value >= 5 ? "warn" : "bad";
    case "net_profit_margin":
      return value > 15 ? "good" : value >= 5 ? "warn" : "bad";
    case "current_ratio":
      return value > 2 ? "good" : value >= 1.2 ? "warn" : "bad";
    case "debt_to_equity":
      return value < 1 ? "good" : value <= 2 ? "warn" : "bad";
    case "debt_ratio":
      return value < 0.4 ? "good" : value <= 0.6 ? "warn" : "bad";
    case "revenue_growth":
      return value > 10 ? "good" : value > 0 ? "warn" : "bad";
    default:
      return "neutral";
  }
}
