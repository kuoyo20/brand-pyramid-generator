import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyName } = await req.json();
    if (!companyName || typeof companyName !== "string") {
      return new Response(JSON.stringify({ error: "companyName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `你是一位資深的品牌研究員。根據使用者提供的公司名稱，輸出該公司的基本資訊。
若你不確定，請依名稱合理推測，並在 confidence 註明 "low"。
所有文字使用繁體中文。`;

    const tool = {
      type: "function",
      function: {
        name: "company_profile",
        description: "Return a structured company profile",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "公司正式名稱" },
            industry: { type: "string", description: "所屬產業" },
            description: { type: "string", description: "公司簡介，2-3 句" },
            products: { type: "array", items: { type: "string" }, description: "主要產品或服務" },
            customers: { type: "string", description: "目標客群" },
            differentiators: { type: "array", items: { type: "string" }, description: "差異化優勢" },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["name", "industry", "description", "products", "customers", "differentiators", "confidence"],
          additionalProperties: false,
        },
      },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `請輸出「${companyName}」的公司資訊。` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "company_profile" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "AI 服務目前繁忙，請稍後再試。" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI 額度已用完，請至工作區設定加值。" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI 服務錯誤" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call ? JSON.parse(call.function.arguments) : null;

    return new Response(JSON.stringify({ profile: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("company-lookup error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
