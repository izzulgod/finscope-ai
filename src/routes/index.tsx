import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight, Sparkles, FileText, GitCompareArrows, Star, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — FinScope AI" },
      { name: "description", content: "Your AI financial analysis terminal — recent analyses, watchlist, and quick actions." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: recent } = useQuery({
    queryKey: ["recent-analyses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_analyses")
        .select("id, rating, recommendation, created_at, rule_verdict, report_id, financial_reports!inner(id, year, quarter, company_id, companies!inner(id, name, ticker, sector))")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [c, r, a] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("financial_reports").select("id", { count: "exact", head: true }),
        supabase.from("ai_analyses").select("id", { count: "exact", head: true }),
      ]);
      return { companies: c.count ?? 0, reports: r.count ?? 0, analyses: a.count ?? 0 };
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <Hero />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Companies" value={stats?.companies ?? 0} icon={<Activity className="h-4 w-4" />} />
        <StatCard label="Reports filed" value={stats?.reports ?? 0} icon={<FileText className="h-4 w-4" />} />
        <StatCard label="AI analyses" value={stats?.analyses ?? 0} icon={<Sparkles className="h-4 w-4" />} />
      </section>

      <section>
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <ActionCard to="/analyze" icon={<Sparkles className="h-4 w-4" />} title="New analysis" desc="Manual / PDF / ticker input" />
          <ActionCard to="/compare" icon={<GitCompareArrows className="h-4 w-4" />} title="Compare companies" desc="Side-by-side KPIs and ratios" />
          <ActionCard to="/watchlist" icon={<Star className="h-4 w-4" />} title="Watchlist" desc="Track companies you care about" />
        </div>
      </section>

      <section>
        <SectionHeader title="Recent analyses" link={{ to: "/companies", label: "View all" }} />
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Company</th>
                <th className="px-4 py-2 text-left font-medium">Period</th>
                <th className="px-4 py-2 text-left font-medium">Verdict</th>
                <th className="px-4 py-2 text-left font-medium">Rating</th>
                <th className="px-4 py-2 text-left font-medium">Reco</th>
                <th className="px-4 py-2 text-left font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {(recent ?? []).map((row: any) => {
                const r = row.financial_reports;
                const c = r.companies;
                return (
                  <tr key={row.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <Link to="/companies/$id" params={{ id: c.id }} className="font-medium hover:text-primary">
                        {c.name} {c.ticker && <span className="text-muted-foreground">({c.ticker})</span>}
                      </Link>
                      <div className="text-[11px] text-muted-foreground">{c.sector ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">{r.year}{r.quarter ? ` Q${r.quarter}` : ""}</td>
                    <td className="px-4 py-3 text-xs">{row.rule_verdict ?? "—"}</td>
                    <td className="px-4 py-3 font-mono">{row.rating?.toFixed(1) ?? "—"}/10</td>
                    <td className="px-4 py-3">
                      <RecoBadge value={row.recommendation} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                );
              })}
              {recent && recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No analyses yet. <Link to="/analyze" className="text-primary underline">Start your first one.</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Hero() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8">
      <div className="absolute inset-0 terminal-grid opacity-30" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
          <span className="h-1 w-8 bg-primary" /> Bloomberg meets Apple
        </div>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
          AI-powered financial analysis,<br />in seconds.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Drop in financials manually, upload a PDF report, or pull a ticker. Get ratios, risk scores,
          and an AI investment recommendation — explained.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/analyze" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 glow-primary">
            <Sparkles className="h-4 w-4" /> New analysis
          </Link>
          <Link to="/companies" className="inline-flex items-center gap-2 rounded-md border border-border bg-background/40 px-4 py-2 text-sm hover:bg-muted/40">
            Browse companies <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] uppercase tracking-[0.16em]">{label}</span>
        {icon}
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold tabular">{value}</div>
    </div>
  );
}

function ActionCard({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to as any} className="group rounded-lg border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-muted/30">
      <div className="flex items-center gap-2 text-primary">{icon}<span className="text-xs uppercase tracking-[0.16em]">Action</span></div>
      <div className="mt-2 font-display text-base font-semibold">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
      <ArrowUpRight className="mt-3 h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
    </Link>
  );
}

function SectionHeader({ title, link }: { title: string; link?: { to: string; label: string } }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">{title}</h2>
      {link && <Link to={link.to as any} className="text-xs text-primary hover:underline">{link.label} →</Link>}
    </div>
  );
}

function RecoBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const tone =
    value.includes("Strong Buy") || value === "Buy"
      ? "bg-success-soft text-success border-success-soft"
      : value === "Hold"
        ? "bg-warning-soft text-warning border-warning-soft"
        : "bg-danger-soft text-danger border-danger-soft";
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${tone}`}>{value}</span>;
}
