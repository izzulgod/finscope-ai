// PDF parser: send PDF (base64) to Lovable AI vision and extract structured financials
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOOL = {
  type: "function",
  function: {
    name: "submit_financials",
    description: "Submit extracted financial figures from the PDF",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        company_name: { type: "string" },
        ticker: { type: "string" },
        sector: { type: "string" },
        industry: { type: "string" },
        year: { type: "number" },
        quarter: { type: "number" },
        previous_revenue: { type: "number" },
        income_statement: {
          type: "object",
          additionalProperties: false,
          properties: {
            revenue: { type: "number" },
            cost_of_goods_sold: { type: "number" },
            gross_profit: { type: "number" },
            operating_expense: { type: "number" },
            net_income: { type: "number" },
          },
          required: ["revenue", "net_income"],
        },
        balance_sheet: {
          type: "object",
          additionalProperties: false,
          properties: {
            total_assets: { type: "number" },
            total_liabilities: { type: "number" },
            total_equity: { type: "number" },
            current_assets: { type: "number" },
            current_liabilities: { type: "number" },
            inventory: { type: "number" },
          },
          required: ["total_assets", "total_liabilities", "total_equity", "current_assets", "current_liabilities"],
        },
        cash_flow: {
          type: "object",
          additionalProperties: false,
          properties: {
            operating_cash_flow: { type: "number" },
            investing_cash_flow: { type: "number" },
            financing_cash_flow: { type: "number" },
          },
        },
      },
      required: ["company_name", "year", "income_statement", "balance_sheet", "cash_flow"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { fileDataUrl, fileName } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: "Extract structured financial data from the uploaded financial report. Use full numeric values (no abbreviations like '1.2M' — convert to 1200000). If a value is not present, omit it.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Extract the most recent fiscal-period financials from this report (${fileName ?? "PDF"}) and call submit_financials.` },
              { type: "image_url", image_url: { url: fileDataUrl } },
            ],
          },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "submit_financials" } },
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: t }), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await r.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : null;
    if (!args) throw new Error("Could not extract financials from PDF");
    return new Response(JSON.stringify({ payload: { source: "pdf", ...args } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
