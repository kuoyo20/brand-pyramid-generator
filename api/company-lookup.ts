// Vercel serverless function — uses Anthropic Claude API
export const config = { runtime: "edge" };

interface CompanyLookupBody {
  companyName?: string;
}

const SCHEMA = {
  type: "object" as const,
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
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
      },
    });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json()) as CompanyLookupBody;
    const companyName = body.companyName?.trim();
    if (!companyName) return json({ error: "companyName is required" }, 400);

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system:
          "你是一位資深的品牌研究員。根據使用者提供的公司名稱，輸出該公司的基本資訊。若不確定請依名稱合理推測，並在 confidence 註明 \"low\"。所有文字使用繁體中文。",
        tools: [
          {
            name: "company_profile",
            description: "Return a structured company profile",
            input_schema: SCHEMA,
          },
        ],
        tool_choice: { type: "tool", name: "company_profile" },
        messages: [{ role: "user", content: `請輸出「${companyName}」的公司資訊。` }],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("Claude error", resp.status, t);
      let upstream = t;
      try {
        const j = JSON.parse(t);
        upstream = j?.error?.message ?? j?.error ?? t;
      } catch {
        // keep raw
      }
      return json({ error: `(${resp.status}) ${String(upstream).slice(0, 280)}` }, resp.status >= 500 ? 502 : resp.status);
    }

    const data = await resp.json();
    const toolUse = data.content?.find((c: { type: string }) => c.type === "tool_use");
    if (!toolUse) return json({ error: "Claude 未回傳結構化結果" }, 500);

    return json({ profile: toolUse.input });
  } catch (e) {
    console.error("company-lookup error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
