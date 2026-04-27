import { useState } from "react";
import { Search, Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MasterPicker } from "@/components/MasterPicker";
import { PyramidView } from "@/components/PyramidView";
import { PositioningChart } from "@/components/PositioningChart";
import type { BrandPyramid, CompanyProfile } from "@/types/pyramid";
import { MASTERS } from "@/lib/masters";

const Index = () => {
  const [companyName, setCompanyName] = useState("");
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [masterVoice, setMasterVoice] = useState("sinek");
  const [audience, setAudience] = useState<"external" | "internal">("external");
  const [pyramid, setPyramid] = useState<BrandPyramid | null>(null);

  const [isLooking, setIsLooking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const callApi = async (path: string, body: unknown, attempt = 1): Promise<Record<string, unknown>> => {
    try {
      const resp = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const data = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
      if (!resp.ok || data?.error) {
        const msg = (data?.error as string) ?? `HTTP ${resp.status}`;
        if (attempt < 2 && (resp.status === 429 || resp.status >= 500)) {
          await new Promise((r) => setTimeout(r, 1500));
          return callApi(path, body, attempt + 1);
        }
        throw new Error(`${path.split("/").pop()}: ${msg}`);
      }
      return data;
    } catch (e) {
      if (attempt < 2 && e instanceof TypeError) {
        await new Promise((r) => setTimeout(r, 1500));
        return callApi(path, body, attempt + 1);
      }
      console.error(`[callApi] ${path} failed:`, e);
      throw e;
    }
  };

  const lookupCompany = async () => {
    const name = companyName.trim();
    if (!name) {
      toast.error("請先輸入公司名稱");
      return;
    }
    setIsLooking(true);
    try {
      const data = await callApi("/api/company-lookup", { companyName: name });
      setProfile(data.profile);
      toast.success(`已帶入「${data.profile?.name ?? name}」資訊`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "查詢失敗");
    } finally {
      setIsLooking(false);
    }
  };

  const generate = async () => {
    const name = companyName.trim();
    if (!name) {
      toast.error("請先輸入公司名稱");
      return;
    }
    setIsGenerating(true);
    try {
      const payload = { companyName: name, companyContext: profile, masterVoice };
      const [coreRes, posRes] = await Promise.allSettled([
        callApi("/api/generate-pyramid", payload),
        callApi("/api/generate-positioning", payload),
      ]);
      if (coreRes.status === "rejected") throw coreRes.reason;
      if (posRes.status === "rejected") throw posRes.reason;
      const core = coreRes.value as { pyramid: Omit<BrandPyramid, "positioning"> };
      const pos = posRes.value as { positioning: BrandPyramid["positioning"] };
      setPyramid({ ...core.pyramid, positioning: pos.positioning });
      toast.success("品牌金字塔已生成");
      setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      console.error("[generate] failed:", e);
      toast.error(e instanceof Error ? e.message : String(e) || "生成失敗");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentMaster = MASTERS.find((m) => m.id === masterVoice);

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <header className="relative overflow-hidden border-b-2 border-foreground">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div
          className="absolute inset-0 -z-10 opacity-60 mix-blend-screen"
          style={{ backgroundImage: "var(--gradient-mesh)" }}
        />
        <div
          className="absolute inset-0 -z-10 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* 漂浮便利貼裝飾 */}
        <div className="hidden md:block absolute top-12 left-8 rotate-[-8deg] bg-sticky-yellow border-2 border-ink rounded-xl px-4 py-2 font-hand text-2xl text-ink shadow-[4px_4px_0_hsl(var(--ink))] animate-float-up">
          願景 🌅
        </div>
        <div
          className="hidden md:block absolute top-32 right-12 rotate-[6deg] bg-sticky-pink border-2 border-ink rounded-xl px-4 py-2 font-hand text-2xl text-ink shadow-[4px_4px_0_hsl(var(--ink))] animate-float-up"
          style={{ animationDelay: "0.15s" }}
        >
          使命 🎯
        </div>
        <div
          className="hidden lg:block absolute bottom-24 left-16 rotate-[5deg] bg-sticky-blue border-2 border-ink rounded-xl px-4 py-2 font-hand text-2xl text-ink shadow-[4px_4px_0_hsl(var(--ink))] animate-float-up"
          style={{ animationDelay: "0.3s" }}
        >
          價值觀 🧭
        </div>
        <div
          className="hidden lg:block absolute bottom-20 right-20 rotate-[-4deg] bg-sticky-green border-2 border-ink rounded-xl px-4 py-2 font-hand text-2xl text-ink shadow-[4px_4px_0_hsl(var(--ink))] animate-float-up"
          style={{ animationDelay: "0.45s" }}
        >
          定位 📍
        </div>

        <div className="container max-w-5xl py-16 md:py-24 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-paper/95 border-2 border-ink shadow-[3px_3px_0_hsl(var(--ink))] font-mono-ui text-xs font-bold text-ink mb-6 animate-float-up">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            BRAND PYRAMID LAB · v1.0
          </div>
          <h1
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-paper leading-[0.95] animate-float-up"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="block">先有願景，</span>
            <span className="inline-block bg-sticky-yellow text-ink px-4 py-1 rounded-2xl rotate-[-2deg] mx-1 my-3 border-2 border-ink shadow-[6px_6px_0_hsl(var(--ink))]">
              再有使命
            </span>
            <span className="block">最後是價值觀</span>
          </h1>
          <p
            className="text-paper/90 mt-8 text-base md:text-xl max-w-2xl mx-auto leading-relaxed animate-float-up"
            style={{ animationDelay: "0.25s" }}
          >
            輸入品牌，AI 立刻梳理「<b className="text-sticky-yellow">願景 × 使命 × 價值觀</b>」，<br className="hidden md:block" />
            含對內對外語境，與真實競爭者並列的<b className="text-sticky-yellow">市場定位四象限</b>。
          </p>
        </div>
      </header>

      {/* Step 1 — input */}
      <section className="container max-w-3xl -mt-10 md:-mt-14 pb-2 relative z-10 animate-float-up" style={{ animationDelay: "0.4s" }}>
        <div className="paper-card-lg p-6 md:p-8 bg-card relative">
          <span className="tape tape-pink" />
          <div className="flex items-center gap-2 mb-1">
            <span className="chip bg-sticky-yellow text-ink">STEP 01</span>
            <span className="font-hand text-2xl text-ink">公司是誰？</span>
          </div>
          <p className="text-sm text-ink/70 mb-4">輸入名稱，按放大鏡讓 AI 帶入背景資料。</p>
          <div className="flex gap-2">
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") lookupCompany();
              }}
              placeholder="例：誠品書店、無印良品、王品集團…"
              className="h-14 border-2 border-ink bg-paper px-4 font-display text-lg shadow-none focus-visible:ring-0 focus-visible:border-accent rounded-xl"
            />
            <Button
              onClick={lookupCompany}
              disabled={isLooking}
              size="lg"
              className="btn-pop-lg h-14 w-14 shrink-0 bg-ink text-paper hover:bg-accent rounded-xl"
              aria-label="查詢公司"
            >
              {isLooking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            </Button>
          </div>

          {profile && (
            <div className="mt-5 sticky-note bg-sticky-blue animate-float-up">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div>
                  <div className="font-mono-ui text-[10px] uppercase tracking-wider text-ink/60 mb-1">
                    AI 帶入 · 信心度 {profile.confidence}
                  </div>
                  <h3 className="font-display text-xl text-ink">{profile.name}</h3>
                </div>
                <span className="chip bg-paper text-ink">{profile.industry}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink/85">{profile.description}</p>
              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <span className="font-hand text-base text-accent">客群：</span>
                  <span className="text-ink/85">{profile.customers}</span>
                </div>
                <div>
                  <span className="font-hand text-base text-accent">差異化：</span>
                  <span className="text-ink/85">{profile.differentiators.join("・")}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Step 2 — master voice */}
      <section className="container max-w-5xl py-12">
        <div className="text-center mb-6">
          <span className="chip bg-sticky-pink text-ink">STEP 02</span>
          <h2 className="font-display text-3xl md:text-4xl text-ink mt-3">
            選一位<span className="doodle-underline">大師</span>當你的語境
          </h2>
          <p className="mt-2 text-sm text-ink/70">AI 將以他的思維與語言生成你的品牌金字塔。</p>
        </div>
        <MasterPicker value={masterVoice} onChange={setMasterVoice} />
      </section>

      {/* Step 3 — generate */}
      <section className="container max-w-3xl pb-12">
        <div className="paper-card-lg p-8 md:p-10 bg-sticky-green text-center relative">
          <span className="tape" />
          <span className="chip bg-paper text-ink">STEP 03</span>
          <h2 className="font-display text-3xl md:text-4xl text-ink mt-3 mb-2">
            一鍵生成品牌金字塔
          </h2>
          {currentMaster && (
            <p className="text-sm text-ink/80 mb-6">
              將以 <span className="font-hand text-2xl text-accent">「{currentMaster.name}」</span> 的語境生成
            </p>
          )}
          <Button
            onClick={generate}
            disabled={isGenerating}
            size="lg"
            className="btn-pop-lg h-14 px-10 bg-ink text-paper text-base font-bold hover:bg-accent rounded-xl"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 正在梳理…
              </>
            ) : pyramid ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5" /> 重新生成
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" /> 開始生成
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Result */}
      {pyramid && (
        <section id="result" className="container max-w-6xl pb-20">
          <div className="mb-12 text-center">
            <span className="font-hand text-3xl text-accent">tagline</span>
            <div className="font-mono-ui text-[11px] uppercase tracking-wider text-ink/60 mb-2">
              品牌金字塔 · {pyramid.companyName}
            </div>
            <blockquote className="font-display text-3xl md:text-5xl leading-tight text-ink text-balance">
              「<span className="doodle-underline">{pyramid.tagline}</span>」
            </blockquote>
          </div>

          <Tabs value={audience} onValueChange={(v) => setAudience(v as "external" | "internal")}>
            <div className="mb-10 flex justify-center">
              <TabsList className="rounded-2xl border-2 border-ink bg-card p-1 h-auto shadow-[3px_3px_0_hsl(var(--ink))]">
                <TabsTrigger
                  value="external"
                  className="rounded-xl px-6 py-3 font-mono-ui text-xs uppercase tracking-wider data-[state=active]:bg-ink data-[state=active]:text-paper data-[state=active]:shadow-none"
                >
                  📣 對外 · 對消費者
                </TabsTrigger>
                <TabsTrigger
                  value="internal"
                  className="rounded-xl px-6 py-3 font-mono-ui text-xs uppercase tracking-wider data-[state=active]:bg-ink data-[state=active]:text-paper data-[state=active]:shadow-none"
                >
                  🤝 對內 · 對員工
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="external" className="mt-0">
              <PyramidView pyramid={pyramid} audience="external" />
            </TabsContent>
            <TabsContent value="internal" className="mt-0">
              <PyramidView pyramid={pyramid} audience="internal" />
            </TabsContent>
          </Tabs>

          <div className="mt-20">
            <PositioningChart positioning={pyramid.positioning} />
          </div>

          <div className="mt-16 flex justify-center gap-3">
            <Button
              onClick={generate}
              disabled={isGenerating}
              size="lg"
              className="btn-pop-lg bg-card text-ink hover:bg-sticky-yellow rounded-xl"
            >
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              重新生成（同一語境）
            </Button>
          </div>
        </section>
      )}

      <footer className="border-t-2 border-foreground py-8 bg-secondary">
        <div className="container max-w-5xl flex items-center justify-between flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-2 font-mono-ui text-foreground">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <b>BRAND PYRAMID LAB</b>
            <span className="text-muted-foreground">— 願景・使命・價值觀</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Powered by <b className="text-foreground">Lovable AI</b>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Index;
