import type { FinancialPayload } from "./types";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePayload(p: FinancialPayload): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const yearNow = new Date().getFullYear();
  if (!p.company_name) errors.push("Company name required");
  if (!p.year || p.year < 1990 || p.year > yearNow) errors.push("Year must be between 1990 and current year");
  if (!p.income_statement?.revenue) errors.push("Revenue required");
  if (p.income_statement?.revenue !== undefined && p.income_statement.revenue < 0) warnings.push("Negative revenue is unusual");
  if (!p.balance_sheet?.total_assets) errors.push("Total assets required");
  if (!p.balance_sheet?.total_equity) errors.push("Total equity required");
  if (!p.balance_sheet?.current_liabilities) errors.push("Current liabilities required");
  if (
    p.balance_sheet?.total_assets !== undefined &&
    p.balance_sheet?.total_liabilities !== undefined &&
    p.balance_sheet.total_assets < p.balance_sheet.total_liabilities
  ) {
    warnings.push("Assets less than liabilities — potential insolvency");
  }
  return { ok: errors.length === 0, errors, warnings };
}
