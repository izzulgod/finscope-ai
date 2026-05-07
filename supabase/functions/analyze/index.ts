// Lovable AI: financial analysis
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are an expert financial analyst AI. You will receive a company's structured financial data and pre-calculated ratios. Produce a comprehensive, professional analysis covering profitability, liquidity, solvency, growth, operational efficiency and risk. Be specific, cite the numbers, and provide actionable recommendations. Output MUST be valid JSON matching the requested schema.`;

const TOOL = {
  type: "function",
  function: {
    name: "submit_analysis",
    description: "Submit the structured financial analysis",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        summary: { type: "string", description: "2-3 sentence executive summary" },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        risks: { type: "array", items: { type: "string" } },
        recommended_actions: { type: "array", items: { type: "string" } },
        rating: { type: "number", description: "Overall health rating 1-10" },
        recommendation: {
          type: "string",
          enum: ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"],
        },
      },
      required: ["summary", "strengths", "weaknesses", "risks", "recommended_actions", "rating", "recommendation"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { payload, ratios, decision } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const userMsg = `Company: ${payload.company_name}${payload.ticker ? ` (${payload.ticker})` : ""}
Period: ${payload.year}${payload.quarter ? ` Q${payload.quarter}` : ""}
Sector: ${payload.sector ?? "N/A"} / ${payload.industry ?? "N/A"}

Financial Ratios:
- ROE: ${fmt(ratios.roe)}%
- ROA: ${fmt(ratios.roa)}%
- Net Profit Margin: ${fmt(ratios.net_profit_margin)}%
- Gross Margin: ${fmt(ratios.gross_profit_margin)}%
- Current Ratio: ${fmt(ratios.current_ratio)}
- Quick Ratio: ${fmt(ratios.quick_ratio)}
- Debt-to-Equity: ${fmt(ratios.debt_to_equity)}
- Debt Ratio: ${fmt(ratios.debt_ratio)}
- Revenue Growth YoY: ${fmt(ratios.revenue_growth)}%

Raw figures (in reporting currency):
- Revenue: ${payload.income_statement.revenue}
- Net Income: ${payload.income_statement.net_income}
- Total Assets: ${payload.balance_sheet.total_assets}
- Total Liabilities: ${payload.balance_sheet.total_liabilities}
- Total Equity: ${payload.balance_sheet.total_equity}
- Operating Cash Flow: ${payload.cash_flow.operating_cash_flow ?? "N/A"}

Rule-engine result: score=${decision.score}, verdict=${decision.verdict}, flags=${JSON.stringify(decision.flags)}.

Produce a complete financial analysis report by calling submit_analysis.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "submit_analysis" } },
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: t }), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await r.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : null;
    if (!args) throw new Error("No analysis returned");

    return new Response(JSON.stringify({ analysis: args, model: data.model }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return "N/A";
  return n.toFixed(2);
}
