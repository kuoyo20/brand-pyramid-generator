// Vercel serverless function — uses Anthropic Claude API
// Generates only the positioning analysis (4 maps + core competencies).
export const config = { runtime: "edge", regions: ["iad1"] };

interface GenerateBody {
  companyName?: string;
  companyContext?: unknown;
  masterVoice?: string;
}

const SCHEMA = {
  type: "object" as const,
  properties: {
    maps: {
      type: "array",
      description: "正好 4 張不同 Y 軸的定位圖",
      items: {
        type: "object",
        properties: {
          xAxisLabel: { type: "string", description: "永遠是『價格』" },
          yAxisLabel: { type: "string", description: "正向變數，每張不同" },
          yAxisRationale: { type: "string", description: "為什麼選這個 Y 軸，1 句" },
          brand: {
            type: "object",
            properties: { x: { type: "number" }, y: { type: "number" } },
            required: ["x", "y"],
          },
          competitors: {
            type: "array",
            description: "3-4 個真實的市場競爭對手",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                x: { type: "number" },
                y: { type: "number" },
              },
              required: ["name", "x", "y"],
            },
          },
          insight: { type: "string", description: "從這張圖看到的洞察，1 句" },
        },
        required: ["xAxisLabel", "yAxisLabel", "yAxisRationale", "brand", "competitors", "insight"],
      },
    },
    coreCompetencies: {
      type: "object",
      description: "從 maps 中選出本品牌排名最高的 2 個 Y 軸",
      properties: {
        yAxisLabels: {
          type: "array",
          items: { type: "string" },
          description: "正好 2 個 yAxisLabel，必須與 maps 中的 yAxisLabel 完全一致",
        },
        summary: { type: "string", description: "為什麼這 2 個是真正的核心競爭力，1-2 句" },
      },
      required: ["yAxisLabels", "summary"],
    },
  },
  required: ["maps", "coreCompetencies"],
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
    const body = (await req.json()) as GenerateBody;
    const companyName = body.companyName?.trim();
    if (!companyName) return json({ error: "companyName is required" }, 400);

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);

    const systemPrompt = `你是一位頂尖的品牌策略顧問，擅長產出市場定位多維度分析。

針對指定品牌產出「市場定位多維度分析」(positioning)：
• X 軸永遠是「價格」(0=低, 100=高)
• Y 軸是任何正向變數 — 你必須產出 **正好 4 張不同的定位圖 (maps)**，每張使用不同的 Y 軸（例：品質、設計感、服務速度、永續性、專業度、創新性、品牌聲量、文化深度…），挑選與該產業最相關的 4 個維度
• 每張圖都要包含本品牌與 **3-4 個真實的市場競爭對手**（用真實品牌名）
• 所有座標 0-100。**必須誠實評估，不可讓本品牌在每張圖上都最高**。在某些維度上競爭對手就是比本品牌強，請如實標出
• 從這 4 張圖中，找出本品牌在 Y 軸上**排名最高的 2 個維度**作為「核心競爭力 (coreCompetencies)」，並回傳這 2 個 yAxisLabel
• coreCompetencies.summary 用 1-2 句話說明：為什麼這 2 個維度是該品牌真正的利基

所有文字使用繁體中文，精煉有力。`;

    const userParts: string[] = [`公司名稱：${companyName}`];
    if (body.companyContext) userParts.push(`公司資訊：${JSON.stringify(body.companyContext)}`);

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 3072,
        system: systemPrompt,
        tools: [{ name: "positioning_analysis", description: "Return market positioning analysis", input_schema: SCHEMA }],
        tool_choice: { type: "tool", name: "positioning_analysis" },
        messages: [{ role: "user", content: userParts.join("\n\n") }],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("Claude error", resp.status, t);
      let upstream = t;
      try { const j = JSON.parse(t); upstream = j?.error?.message ?? j?.error ?? t; } catch { /* keep raw */ }
      return json({ error: `(${resp.status}) ${String(upstream).slice(0, 280)}` }, resp.status >= 500 ? 502 : resp.status);
    }

    const data = await resp.json();
    const toolUse = data.content?.find((c: { type: string }) => c.type === "tool_use");
    if (!toolUse) return json({ error: "Claude 未回傳結構化結果" }, 500);

    return json({ positioning: toolUse.input });
  } catch (e) {
    console.error("generate-positioning error", e);
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
