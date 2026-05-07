import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KpiCard } from "@/components/kpi-card";
import { RiskBar } from "@/components/risk-bar";
import { classify } from "@/lib/finance/ratios";
import { riskLevels } from "@/lib/finance/decision";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { Star, Sparkles, MessageSquare, Loader2, Send, ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { getSessionId } from "@/lib/session";

export const Route = createFileRoute("/companies/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Company ${params.id} — FinScope AI` }],
  }),
  component: CompanyPage,
});

function CompanyPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: company } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: reports } = useQuery({
    queryKey: ["reports", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_reports")
        .select("*, financial_ratios(*), ai_analyses(*)")
        .eq("company_id", id)
        .order("year", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: watch } = useQuery({
    queryKey: ["watch", id],
    queryFn: async () => {
      const sid = getSessionId();
      const { data } = await supabase.from("watchlist").select("id").eq("company_id", id).eq("user_id", sid).maybeSingle();
      return data;
    },
  });

  const latest = reports?.[reports.length - 1];
  const ratios = latest?.financial_ratios?.[0];
  const analysis = latest?.ai_analyses?.[0];

  if (!company) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  if (!latest) return <div className="p-10 text-sm text-muted-foreground">No reports.</div>;

  const risks = ratios ? riskLevels(ratios) : null;

  async function toggleWatch() {
    const sid = getSessionId();
    if (watch) {
      await supabase.from("watchlist").delete().eq("id", watch.id);
      toast.success("Removed from watchlist");
    } else {
      await supabase.from("watchlist").insert({ company_id: id, user_id: sid });
      toast.success("Added to watchlist");
    }
    qc.invalidateQueries({ queryKey: ["watch", id] });
  }

  const trendData = (reports ?? []).map((r) => ({
    period: `${r.year}${r.quarter ? `Q${r.quarter}` : ""}`,
    revenue: Number(r.revenue ?? 0),
    net_income: Number(r.net_income ?? 0),
    ocf: Number(r.operating_cash_flow ?? 0),
    debt: Number(r.total_liabilities ?? 0),
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/companies" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Companies
          </Link>
          <h1 className="mt-1 font-display text-2xl font-semibold">
            {company.name} {company.ticker && <span className="text-muted-foreground">({company.ticker})</span>}
          </h1>
          <div className="text-xs text-muted-foreground">
            {company.sector ?? "—"} · {company.industry ?? "—"} · Latest: {latest.year}{latest.quarter ? ` Q${latest.quarter}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={toggleWatch}>
            <Star className={`h-4 w-4 ${watch ? "fill-warning text-warning" : ""}`} />
            {watch ? "Watching" : "Watch"}
          </Button>
          <Link to="/analyze" className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90">
            <Sparkles className="h-4 w-4" /> New report
          </Link>
        </div>
      </div>

      {/* Top: AI rating + overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">AI Rating</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-5xl font-semibold tabular text-primary">
              {analysis?.rating?.toFixed(1) ?? "—"}
            </span>
            <span className="text-sm text-muted-foreground">/10</span>
          </div>
          <div className="mt-2 text-xs">{analysis?.recommendation ?? "—"}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{analysis?.rule_verdict ?? ""}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 md:col-span-2">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Overview</div>
          <p className="mt-2 text-sm leading-relaxed">{analysis?.summary ?? "Awaiting analysis."}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <Stat label="Revenue" value={fmtMoney(latest.revenue)} />
            <Stat label="Net income" value={fmtMoney(latest.net_income)} />
            <Stat label="Total assets" value={fmtMoney(latest.total_assets)} />
            <Stat label="Total equity" value={fmtMoney(latest.total_equity)} />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="ROE" value={ratios?.roe ?? null} unit="%" health={classify("roe", ratios?.roe ?? null)} />
        <KpiCard label="ROA" value={ratios?.roa ?? null} unit="%" health={classify("roa", ratios?.roa ?? null)} />
        <KpiCard label="Net margin" value={ratios?.net_profit_margin ?? null} unit="%" health={classify("net_profit_margin", ratios?.net_profit_margin ?? null)} />
        <KpiCard label="Current ratio" value={ratios?.current_ratio ?? null} health={classify("current_ratio", ratios?.current_ratio ?? null)} />
        <KpiCard label="Debt / Equity" value={ratios?.debt_to_equity ?? null} health={classify("debt_to_equity", ratios?.debt_to_equity ?? null)} />
        <KpiCard label="Quick ratio" value={ratios?.quick_ratio ?? null} health={classify("current_ratio", ratios?.quick_ratio ?? null)} />
        <KpiCard label="Gross margin" value={ratios?.gross_profit_margin ?? null} unit="%" health={classify("net_profit_margin", ratios?.gross_profit_margin ?? null)} />
        <KpiCard label="Revenue growth" value={ratios?.revenue_growth ?? null} unit="%" health={classify("revenue_growth", ratios?.revenue_growth ?? null)} />
      </div>

      {/* Charts + AI panel */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ChartCard title="Revenue & Net income">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData}>
                <CartesianGrid stroke="var(--grid-line)" strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v) => fmtCompact(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => fmtMoney(v)} />
                <Bar dataKey="revenue" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net_income" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="Operating cash flow">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="ocf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--grid-line)" strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={fmtCompact} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => fmtMoney(v)} />
                  <Area type="monotone" dataKey="ocf" stroke="var(--chart-1)" fill="url(#ocf)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Debt trend">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData}>
                  <CartesianGrid stroke="var(--grid-line)" strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={fmtCompact} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => fmtMoney(v)} />
                  <Line type="monotone" dataKey="debt" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>

        <AIInsight analysis={analysis} />
      </div>

      {risks && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">Risk analysis</h3>
            <span className="text-xs text-muted-foreground">Higher % = higher risk</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <RiskBar label="Overall financial risk" value={risks.overall} />
            <RiskBar label="Liquidity risk" value={risks.liquidity} />
            <RiskBar label="Leverage risk" value={risks.leverage} />
            <RiskBar label="Solvency risk" value={risks.solvency} />
          </div>
        </div>
      )}

      <Chat companyId={id} context={{ company, latest, ratios, analysis }} />

      <div className="text-xs text-muted-foreground">
        <Link to="/forecast/$id" params={{ id }} className="text-primary hover:underline">→ Generate AI forecast</Link>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-2 font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="font-mono tabular text-sm">{value}</div>
    </div>
  );
}

function AIInsight({ analysis }: { analysis: any }) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <h3 className="font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">AI Insight</h3>
      <Section title="Strengths" items={analysis?.strengths ?? []} tone="good" />
      <Section title="Weaknesses" items={analysis?.weaknesses ?? []} tone="warn" />
      <Section title="Risks" items={analysis?.risks ?? []} tone="bad" />
      <Section title="Recommended actions" items={analysis?.recommended_actions ?? []} tone="info" />
    </div>
  );
}

function Section({ title, items, tone }: { title: string; items: string[]; tone: "good" | "warn" | "bad" | "info" }) {
  const cls = { good: "text-success", warn: "text-warning", bad: "text-danger", info: "text-secondary" }[tone];
  return (
    <div>
      <div className={`text-[11px] uppercase tracking-[0.16em] ${cls}`}>{title}</div>
      <ul className="mt-1 space-y-1 text-sm">
        {items?.length ? items.map((it, i) => <li key={i} className="leading-snug">• {it}</li>) : <li className="text-muted-foreground">—</li>}
      </ul>
    </div>
  );
}

function Chat({ companyId, context }: { companyId: string; context: any }) {
  const [msgs, setMsgs] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const userMsg = { role: "user" as const, content: input };
    const next = [...msgs, userMsg];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const sid = getSessionId();
      await supabase.from("chat_messages").insert({ company_id: companyId, user_id: sid, role: "user", content: userMsg.content });
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { messages: next, context },
      });
      if (error) throw error;
      const reply = data.reply as string;
      setMsgs([...next, { role: "assistant", content: reply }]);
      await supabase.from("chat_messages").insert({ company_id: companyId, user_id: sid, role: "assistant", content: reply });
    } catch (e: any) {
      toast.error(e?.message ?? "Chat failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold">Ask the AI analyst</h3>
      </div>
      <div className="max-h-80 space-y-3 overflow-y-auto p-4 text-sm">
        {msgs.length === 0 && (
          <div className="space-y-1 text-muted-foreground">
            <div>Try: <em>“Why is the ROE this level?”</em></div>
            <div>Try: <em>“What's the biggest risk for this company?”</em></div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 ${m.role === "user" ? "bg-primary/15 text-foreground" : "bg-muted/50 text-foreground"}`}>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{m.role}</div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask anything about this company…"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <Button onClick={send} disabled={loading || !input.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

function fmtMoney(v: any) {
  const n = Number(v ?? 0);
  if (!isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
function fmtCompact(v: any) {
  const n = Number(v);
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}
