import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calculateRatios } from "@/lib/finance/ratios";
import { evaluateCompany } from "@/lib/finance/decision";
import { validatePayload } from "@/lib/finance/validate";
import type { FinancialPayload } from "@/lib/finance/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { getSessionId } from "@/lib/session";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "New Analysis — FinScope AI" },
      { name: "description", content: "Run an AI financial analysis from manual inputs, a PDF report, or a stock ticker." },
    ],
  }),
  component: AnalyzePage,
});

const empty: FinancialPayload = {
  source: "manual",
  company_name: "",
  ticker: "",
  sector: "",
  industry: "",
  year: new Date().getFullYear() - 1,
  quarter: undefined,
  previous_revenue: undefined,
  income_statement: { revenue: 0, cost_of_goods_sold: 0, gross_profit: 0, operating_expense: 0, net_income: 0 },
  balance_sheet: { total_assets: 0, total_liabilities: 0, total_equity: 0, current_assets: 0, current_liabilities: 0, inventory: 0 },
  cash_flow: { operating_cash_flow: 0, investing_cash_flow: 0, financing_cash_flow: 0 },
};

const sample: FinancialPayload = {
  source: "manual",
  company_name: "Acme Industries",
  ticker: "ACME",
  sector: "Industrials",
  industry: "Diversified manufacturing",
  year: 2024,
  quarter: undefined,
  previous_revenue: 900_000,
  income_statement: { revenue: 1_000_000, cost_of_goods_sold: 600_000, gross_profit: 400_000, operating_expense: 150_000, net_income: 200_000 },
  balance_sheet: { total_assets: 500_000, total_liabilities: 100_000, total_equity: 400_000, current_assets: 250_000, current_liabilities: 80_000, inventory: 40_000 },
  cash_flow: { operating_cash_flow: 220_000, investing_cash_flow: -50_000, financing_cash_flow: -30_000 },
};

export default function AnalyzePage() {
  const navigate = useNavigate();
  const [data, setData] = useState<FinancialPayload>(empty);
  const [running, setRunning] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [tab, setTab] = useState("manual");

  function set<K extends keyof FinancialPayload>(k: K, v: FinancialPayload[K]) {
    setData((d) => ({ ...d, [k]: v }));
  }
  function setIS<K extends keyof FinancialPayload["income_statement"]>(k: K, v: number) {
    setData((d) => ({ ...d, income_statement: { ...d.income_statement, [k]: v } }));
  }
  function setBS<K extends keyof FinancialPayload["balance_sheet"]>(k: K, v: number) {
    setData((d) => ({ ...d, balance_sheet: { ...d.balance_sheet, [k]: v } }));
  }
  function setCF<K extends keyof FinancialPayload["cash_flow"]>(k: K, v: number) {
    setData((d) => ({ ...d, cash_flow: { ...d.cash_flow, [k]: v } }));
  }

  async function run() {
    const v = validatePayload(data);
    if (!v.ok) {
      toast.error(v.errors.join("; "));
      return;
    }
    v.warnings.forEach((w) => toast.warning(w));
    setRunning(true);
    try {
      const ratios = calculateRatios(data);
      const decision = evaluateCompany(ratios);
      const userId = getSessionId();

      // upsert company by name+ticker
      let companyId: string | null = null;
      const { data: existing } = await supabase
        .from("companies")
        .select("id")
        .eq("name", data.company_name)
        .maybeSingle();
      if (existing) companyId = existing.id;
      else {
        const { data: c, error } = await supabase
          .from("companies")
          .insert({ name: data.company_name, ticker: data.ticker || null, sector: data.sector || null, industry: data.industry || null })
          .select("id")
          .single();
        if (error) throw error;
        companyId = c.id;
      }

      const { data: report, error: rerr } = await supabase
        .from("financial_reports")
        .insert({
          company_id: companyId,
          user_id: userId,
          year: data.year,
          quarter: data.quarter ?? null,
          source: data.source,
          revenue: data.income_statement.revenue,
          cost_of_goods_sold: data.income_statement.cost_of_goods_sold,
          gross_profit: data.income_statement.gross_profit,
          operating_expense: data.income_statement.operating_expense,
          net_income: data.income_statement.net_income,
          total_assets: data.balance_sheet.total_assets,
          total_liabilities: data.balance_sheet.total_liabilities,
          total_equity: data.balance_sheet.total_equity,
          current_assets: data.balance_sheet.current_assets,
          current_liabilities: data.balance_sheet.current_liabilities,
          inventory: data.balance_sheet.inventory,
          operating_cash_flow: data.cash_flow.operating_cash_flow,
          investing_cash_flow: data.cash_flow.investing_cash_flow,
          financing_cash_flow: data.cash_flow.financing_cash_flow,
          raw_json: data as any,
        })
        .select("id")
        .single();
      if (rerr) throw rerr;

      await supabase.from("financial_ratios").insert({ report_id: report.id, ...ratios });

      // Call AI
      const { data: ai, error: aerr } = await supabase.functions.invoke("analyze", {
        body: { payload: data, ratios, decision },
      });
      if (aerr) throw aerr;
      const a = ai.analysis;
      await supabase.from("ai_analyses").insert({
        report_id: report.id,
        summary: a.summary,
        strengths: a.strengths,
        weaknesses: a.weaknesses,
        risks: a.risks,
        recommended_actions: a.recommended_actions,
        rating: a.rating,
        recommendation: a.recommendation,
        rule_score: decision.score,
        rule_verdict: decision.verdict,
        rule_flags: decision.flags,
        model_used: ai.model ?? "google/gemini-2.5-flash",
      });

      toast.success("Analysis complete");
      navigate({ to: "/companies/$id", params: { id: companyId! } });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Analysis failed");
    } finally {
      setRunning(false);
    }
  }

  async function handlePdf(file: File) {
    setParsing(true);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = () => rej(reader.error);
        reader.readAsDataURL(file);
      });
      const { data: parsed, error } = await supabase.functions.invoke("parse-pdf", {
        body: { fileDataUrl: dataUrl, fileName: file.name },
      });
      if (error) throw error;
      const p = parsed.payload as FinancialPayload;
      setData({ ...empty, ...p, source: "pdf" });
      setTab("manual");
      toast.success("Extracted — review and run analysis");
    } catch (e: any) {
      toast.error(e?.message ?? "PDF extraction failed");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-1">
        <div className="text-xs uppercase tracking-[0.2em] text-primary">Analysis</div>
        <h1 className="font-display text-2xl font-semibold">New financial analysis</h1>
        <p className="text-sm text-muted-foreground">Three ways to start. Data is normalized into the same engine.</p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="pdf">PDF Upload</TabsTrigger>
          <TabsTrigger value="ticker">Ticker</TabsTrigger>
        </TabsList>

        <TabsContent value="pdf" className="mt-4">
          <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm">Upload an annual report or financial statement PDF.</p>
            <p className="text-xs text-muted-foreground">AI vision extracts the latest period's figures.</p>
            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {parsing ? "Extracting…" : "Choose PDF"}
              <input
                type="file"
                accept="application/pdf,image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && handlePdf(e.target.files[0])}
              />
            </label>
          </div>
        </TabsContent>

        <TabsContent value="ticker" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            Ticker auto-fetch requires a market data API key. For now, please use Manual or PDF —
            the architecture is wired so a ticker fetcher can plug in here.
          </div>
        </TabsContent>

        <TabsContent value="manual" className="mt-4 space-y-6">
          <Card title="Company">
            <Grid>
              <Field label="Name *"><Input value={data.company_name} onChange={(e) => set("company_name", e.target.value)} /></Field>
              <Field label="Ticker"><Input value={data.ticker ?? ""} onChange={(e) => set("ticker", e.target.value)} /></Field>
              <Field label="Sector"><Input value={data.sector ?? ""} onChange={(e) => set("sector", e.target.value)} /></Field>
              <Field label="Industry"><Input value={data.industry ?? ""} onChange={(e) => set("industry", e.target.value)} /></Field>
              <Field label="Year *"><Input type="number" value={data.year} onChange={(e) => set("year", Number(e.target.value))} /></Field>
              <Field label="Quarter"><Input type="number" min={1} max={4} value={data.quarter ?? ""} onChange={(e) => set("quarter", e.target.value ? Number(e.target.value) : undefined)} /></Field>
              <Field label="Previous-year revenue (for growth)"><Input type="number" value={data.previous_revenue ?? ""} onChange={(e) => set("previous_revenue", e.target.value ? Number(e.target.value) : undefined)} /></Field>
            </Grid>
          </Card>

          <Card title="Income statement">
            <Grid>
              <Field label="Revenue *"><NumIn value={data.income_statement.revenue} onChange={(v) => setIS("revenue", v)} /></Field>
              <Field label="COGS"><NumIn value={data.income_statement.cost_of_goods_sold ?? 0} onChange={(v) => setIS("cost_of_goods_sold", v)} /></Field>
              <Field label="Gross profit"><NumIn value={data.income_statement.gross_profit ?? 0} onChange={(v) => setIS("gross_profit", v)} /></Field>
              <Field label="Operating expense"><NumIn value={data.income_statement.operating_expense ?? 0} onChange={(v) => setIS("operating_expense", v)} /></Field>
              <Field label="Net income *"><NumIn value={data.income_statement.net_income} onChange={(v) => setIS("net_income", v)} /></Field>
            </Grid>
          </Card>

          <Card title="Balance sheet">
            <Grid>
              <Field label="Total assets *"><NumIn value={data.balance_sheet.total_assets} onChange={(v) => setBS("total_assets", v)} /></Field>
              <Field label="Total liabilities"><NumIn value={data.balance_sheet.total_liabilities} onChange={(v) => setBS("total_liabilities", v)} /></Field>
              <Field label="Total equity *"><NumIn value={data.balance_sheet.total_equity} onChange={(v) => setBS("total_equity", v)} /></Field>
              <Field label="Current assets"><NumIn value={data.balance_sheet.current_assets} onChange={(v) => setBS("current_assets", v)} /></Field>
              <Field label="Current liabilities *"><NumIn value={data.balance_sheet.current_liabilities} onChange={(v) => setBS("current_liabilities", v)} /></Field>
              <Field label="Inventory"><NumIn value={data.balance_sheet.inventory ?? 0} onChange={(v) => setBS("inventory", v)} /></Field>
            </Grid>
          </Card>

          <Card title="Cash flow">
            <Grid>
              <Field label="Operating CF"><NumIn value={data.cash_flow.operating_cash_flow ?? 0} onChange={(v) => setCF("operating_cash_flow", v)} /></Field>
              <Field label="Investing CF"><NumIn value={data.cash_flow.investing_cash_flow ?? 0} onChange={(v) => setCF("investing_cash_flow", v)} /></Field>
              <Field label="Financing CF"><NumIn value={data.cash_flow.financing_cash_flow ?? 0} onChange={(v) => setCF("financing_cash_flow", v)} /></Field>
            </Grid>
          </Card>

          <div className="flex items-center gap-2">
            <Button onClick={run} disabled={running} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {running ? "Analyzing…" : "Run AI analysis"}
            </Button>
            <Button variant="outline" onClick={() => setData(sample)}>Load sample</Button>
            <Button variant="ghost" onClick={() => setData(empty)}>Reset</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="mb-3 font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
function NumIn({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <Input className="font-mono tabular" type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />;
}
