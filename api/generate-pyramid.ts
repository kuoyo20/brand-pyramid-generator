// Vercel serverless function — uses Anthropic Claude API
export const config = { runtime: "edge", regions: ["iad1"] };

const MASTER_VOICES: Record<string, string> = {
  kotler: "以 Philip Kotler 行銷管理視角：強調市場區隔、目標客群與價值主張，語言系統化、嚴謹、學術。",
  aaker: "以 David Aaker 品牌權益視角：強調品牌資產、聯想、忠誠度、可感知品質，語言重結構與層次。",
  ries: "以 Al Ries 定位理論視角：強調心智佔有、第一法則、聚焦單一概念，語言銳利、直覺、敢於放棄。",
  sinek: "以 Simon Sinek『Start With Why』黃金圈視角：從 WHY 出發再到 HOW、WHAT，語言富感染力、信念導向。",
  jobs: "以 Steve Jobs 極簡主義視角:去除一切多餘，用最少的字承載最強的信念，語言詩意、果斷、人本。",
  muji: "以原研哉/無印良品『這樣就好』視角：剛剛好、無印之美、誠實的物，語言克制、留白、東方禪意。",
  jobs_chinese: "以賈伯斯式中文語境融合東方哲學：精煉、有禪意、內斂的力量。",
  wu_chingyou: "以誠品吳清友『閱讀照亮生命』的人文視角：書店即人生道場，語言溫潤、文化感重。",
  wang_pin_dai: "以王品戴勝益『敢拚、能賺、愛玩』的台灣本土企業家語境：直白、有人情味、團隊感強。",
};

interface GenerateBody {
  companyName?: string;
  companyContext?: unknown;
  masterVoice?: string;
  extraDocument?: string;
}

const SCHEMA = {
  type: "object" as const,
  properties: {
    companyName: { type: "string" },
    tagline: { type: "string", description: "一句話的品牌標語 (slogan)" },
    vision: {
      type: "object",
      properties: {
        external: { type: "string", description: "對消費者的願景，1-2 句" },
        internal: { type: "string", description: "對員工的願景，1-2 句" },
      },
      required: ["external", "internal"],
    },
    mission: {
      type: "object",
      properties: {
        external: { type: "string" },
        internal: { type: "string" },
      },
      required: ["external", "internal"],
    },
    values: {
      type: "object",
      properties: {
        external: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "價值觀名稱，2-4 字" },
              description: { type: "string", description: "對消費者的詮釋，1 句" },
            },
            required: ["name", "description"],
          },
        },
        internal: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string", description: "對員工的行為指引，1 句" },
            },
            required: ["name", "description"],
          },
        },
      },
      required: ["external", "internal"],
    },
    positioning: {
      type: "object",
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
    },
  },
  required: ["companyName", "tagline", "vision", "mission", "values", "positioning"],
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

    const voice = MASTER_VOICES[body.masterVoice ?? ""] ?? MASTER_VOICES["sinek"];

    const systemPrompt = `你是一位頂尖的品牌策略顧問，擅長為品牌梳理「品牌金字塔」。

品牌金字塔的核心三層：
1. 願景 (Vision) — 品牌想去到的美好未來
2. 使命 (Mission) — 為了去到那個未來，必須完成的事
3. 價值觀 (Values) — 品牌用什麼樣的價值觀做事（3-5 條）

每一層都要產出兩個版本：
• 對外 (external)：對消費者溝通，富感染力、易記、有故事感
• 對內 (internal)：對員工溝通，行為導向、可指導日常決策

另外還要產出「市場定位多維度分析」(positioning)：
• X 軸永遠是「價格」(0=低, 100=高)
• Y 軸是任何正向變數 — 你必須產出 **正好 4 張不同的定位圖 (maps)**，每張使用不同的 Y 軸（例：品質、設計感、服務速度、永續性、專業度、創新性、品牌聲量、文化深度…），挑選與該產業最相關的 4 個維度
• 每張圖都要包含本品牌與 **3-4 個真實的市場競爭對手**（用真實品牌名）
• 所有座標 0-100。**必須誠實評估，不可讓本品牌在每張圖上都最高**。在某些維度上競爭對手就是比本品牌強，請如實標出
• 從這 4 張圖中，找出本品牌在 Y 軸上**排名最高的 2 個維度**作為「核心競爭力 (coreCompetencies)」，並回傳這 2 個 yAxisLabel
• coreCompetencies.summary 用 1-2 句話說明：為什麼這 2 個維度是該品牌真正的利基

語境要求：${voice}

所有文字使用繁體中文。文字精煉、有力量，避免空話與套話。`;

    const userParts: string[] = [`公司名稱：${companyName}`];
    if (body.companyContext) userParts.push(`公司資訊：${JSON.stringify(body.companyContext)}`);
    if (body.extraDocument) userParts.push(`使用者提供的補充文件內容：\n${body.extraDocument.slice(0, 8000)}`);

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        system: systemPrompt,
        tools: [
          {
            name: "brand_pyramid",
            description: "Return a structured brand pyramid",
            input_schema: SCHEMA,
          },
        ],
        tool_choice: { type: "tool", name: "brand_pyramid" },
        messages: [{ role: "user", content: userParts.join("\n\n") }],
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
    if (!toolUse) {
      console.error("No tool_use returned", JSON.stringify(data).slice(0, 500));
      return json({ error: "Claude 未回傳結構化結果" }, 500);
    }
    return json({ pyramid: toolUse.input });
  } catch (e) {
    console.error("generate-pyramid error", e);
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
