import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/forecast/$id")({
  head: () => ({ meta: [{ title: "Forecast — FinScope AI" }] }),
  component: ForecastPage,
});

function ForecastPage() {
  const { id } = Route.useParams();
  const [running, setRunning] = useState(false);
  const [forecast, setForecast] = useState<any>(null);

  const { data: company } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => (await supabase.from("companies").select("*").eq("id", id).single()).data,
  });
  const { data: history } = useQuery({
    queryKey: ["history", id],
    queryFn: async () =>
      (await supabase
        .from("financial_reports")
        .select("year, quarter, revenue, net_income, operating_cash_flow, total_assets, total_equity")
        .eq("company_id", id)
        .order("year")).data ?? [],
  });

  async function run() {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("forecast", { body: { history } });
      if (error) throw error;
      setForecast(data.forecast);
    } finally {
      setRunning(false);
    }
  }

  const chartData = [
    ...(history ?? []).map((h: any) => ({ year: String(h.year), revenue: Number(h.revenue ?? 0), net_income: Number(h.net_income ?? 0), kind: "actual" })),
    ...((forecast?.projections ?? []).map((p: any) => ({ year: String(p.year), revenue: p.revenue, net_income: p.net_income, kind: "forecast" }))),
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <Link to="/companies/$id" params={{ id }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to {company?.name}
      </Link>
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-primary">Forecast</div>
        <h1 className="font-display text-2xl font-semibold">2-year AI projection</h1>
      </header>

      <Button onClick={run} disabled={running || !history?.length} className="bg-primary text-primary-foreground hover:bg-primary/90">
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {running ? "Forecasting…" : "Generate forecast"}
      </Button>

      {forecast && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">Commentary</h3>
            <p className="mt-2 text-sm">{forecast.commentary}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-2 font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">Revenue & net income</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid stroke="var(--grid-line)" strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="var(--chart-2)" />
                <Bar dataKey="net_income" fill="var(--chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
