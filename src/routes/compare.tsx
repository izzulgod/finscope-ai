import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { classify } from "@/lib/finance/ratios";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compare")({
  head: () => ({ meta: [{ title: "Compare — FinScope AI" }] }),
  component: ComparePage,
});

function ComparePage() {
  const { data: companies } = useQuery({
    queryKey: ["companies-min"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id, name, ticker").order("name");
      return data ?? [];
    },
  });
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 3 ? s : [...s, id]));
  }

  const { data: rows } = useQuery({
    queryKey: ["compare", selected],
    enabled: selected.length > 0,
    queryFn: async () => {
      const out: any[] = [];
      for (const id of selected) {
        const { data: c } = await supabase.from("companies").select("*").eq("id", id).single();
        const { data: r } = await supabase
          .from("financial_reports")
          .select("*, financial_ratios(*), ai_analyses(*)")
          .eq("company_id", id)
          .order("year", { ascending: false })
          .limit(1)
          .maybeSingle();
        out.push({ company: c, report: r, ratios: r?.financial_ratios?.[0], analysis: r?.ai_analyses?.[0] });
      }
      return out;
    },
  });

  const metrics: { key: any; label: string; unit?: string }[] = [
    { key: "roe", label: "ROE", unit: "%" },
    { key: "roa", label: "ROA", unit: "%" },
    { key: "net_profit_margin", label: "Net margin", unit: "%" },
    { key: "gross_profit_margin", label: "Gross margin", unit: "%" },
    { key: "current_ratio", label: "Current ratio" },
    { key: "quick_ratio", label: "Quick ratio" },
    { key: "debt_to_equity", label: "Debt/Equity" },
    { key: "debt_ratio", label: "Debt ratio" },
    { key: "revenue_growth", label: "Revenue growth", unit: "%" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-primary">Compare</div>
        <h1 className="font-display text-2xl font-semibold">Side-by-side</h1>
        <p className="text-sm text-muted-foreground">Pick up to 3 companies.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(companies ?? []).map((c) => (
          <button
            key={c.id}
            onClick={() => toggle(c.id)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs",
              selected.includes(c.id) ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:bg-muted/40",
            )}
          >
            {c.name} {c.ticker && <span className="font-mono opacity-60">· {c.ticker}</span>}
          </button>
        ))}
        {!companies?.length && (
          <Link to="/analyze" className="text-sm text-primary underline">Analyze a company first</Link>
        )}
      </div>

      {rows && rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Metric</th>
                {rows.map((r, i) => (
                  <th key={i} className="px-4 py-2 text-left font-medium">
                    {r.company.name} {r.company.ticker && <span className="opacity-60">({r.company.ticker})</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="px-4 py-2 text-muted-foreground">AI Rating</td>
                {rows.map((r, i) => <td key={i} className="px-4 py-2 font-mono">{r.analysis?.rating?.toFixed(1) ?? "—"}/10 — {r.analysis?.recommendation ?? "—"}</td>)}
              </tr>
              {metrics.map((m) => (
                <tr key={m.key} className="border-t border-border">
                  <td className="px-4 py-2 text-muted-foreground">{m.label}</td>
                  {rows.map((r, i) => {
                    const v = r.ratios?.[m.key];
                    const h = classify(m.key, v ?? null);
                    const tone = h === "good" ? "text-success" : h === "warn" ? "text-warning" : h === "bad" ? "text-danger" : "";
                    return (
                      <td key={i} className={cn("px-4 py-2 font-mono tabular", tone)}>
                        {v !== null && v !== undefined ? `${Number(v).toFixed(2)}${m.unit ?? ""}` : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
