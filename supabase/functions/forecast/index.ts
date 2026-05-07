// AI forecast: project next 2 fiscal years
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOOL = {
  type: "function",
  function: {
    name: "submit_forecast",
    description: "Submit 2-year financial projection",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        commentary: { type: "string" },
        projections: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              year: { type: "number" },
              revenue: { type: "number" },
              net_income: { type: "number" },
              operating_cash_flow: { type: "number" },
              eps_growth_pct: { type: "number" },
            },
            required: ["year", "revenue", "net_income", "operating_cash_flow", "eps_growth_pct"],
          },
        },
      },
      required: ["commentary", "projections"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { history } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a financial forecasting AI. Project next 2 fiscal years using the historical reports provided and reasonable macro assumptions. Be conservative and explain your assumptions in commentary." },
          { role: "user", content: `Historical reports:\n${JSON.stringify(history, null, 2)}\n\nCall submit_forecast.` },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "submit_forecast" } },
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: t }), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await r.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : null;
    return new Response(JSON.stringify({ forecast: args }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
