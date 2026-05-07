export interface IncomeStatement {
  revenue: number;
  cost_of_goods_sold?: number;
  gross_profit?: number;
  operating_expense?: number;
  net_income: number;
}

export interface BalanceSheet {
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  current_assets: number;
  current_liabilities: number;
  inventory?: number;
}

export interface CashFlow {
  operating_cash_flow?: number;
  investing_cash_flow?: number;
  financing_cash_flow?: number;
}

export interface FinancialPayload {
  source: "manual" | "pdf" | "ticker";
  company_name: string;
  ticker?: string;
  sector?: string;
  industry?: string;
  year: number;
  quarter?: number;
  previous_revenue?: number;
  income_statement: IncomeStatement;
  balance_sheet: BalanceSheet;
  cash_flow: CashFlow;
}

export interface Ratios {
  roe: number | null;
  roa: number | null;
  net_profit_margin: number | null;
  gross_profit_margin: number | null;
  current_ratio: number | null;
  quick_ratio: number | null;
  debt_to_equity: number | null;
  debt_ratio: number | null;
  revenue_growth: number | null;
}

export interface DecisionResult {
  score: number;
  verdict: string;
  flags: string[];
}

export interface AIAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  recommended_actions: string[];
  rating: number;
  recommendation:
    | "Strong Buy"
    | "Buy"
    | "Hold"
    | "Sell"
    | "Strong Sell";
}
