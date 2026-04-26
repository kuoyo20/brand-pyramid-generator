import { PositioningMap, PositioningAnalysis } from "@/types/pyramid";
import { useMemo, useState } from "react";

interface SingleProps {
  map: PositioningMap;
  isCore?: boolean;
  rank?: number;
}

const SingleChart = ({ map, isCore, rank }: SingleProps) => {
  const W = 480;
  const H = 400;
  const PAD = 50;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  const toX = (x: number) => PAD + (x / 100) * innerW;
  const toY = (y: number) => PAD + (1 - y / 100) * innerH;

  const points = useMemo(
    () => [
      { name: "本品牌", x: map.brand.x, y: map.brand.y, isBrand: true },
      ...map.competitors.map((c) => ({ name: c.name, x: c.x, y: c.y, isBrand: false })),
    ],
    [map],
  );

  const sorted = [...points].sort((a, b) => b.y - a.y);
  const brandRank = sorted.findIndex((p) => p.isBrand) + 1;
  const total = points.length;

  return (
    <div className={`paper-card p-5 ${isCore ? "bg-sticky-yellow/40" : "bg-card"} relative`}>
      {isCore && (
        <span className="absolute -top-3 -right-3 chip bg-accent text-white">
          ⭐ 核心 #{rank}
        </span>
      )}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="font-mono-ui text-[10px] uppercase tracking-wider text-ink/60 mb-1">
            {isCore ? "核心競爭力" : "對比維度"}
          </div>
          <h4 className="font-display text-lg leading-snug text-ink">
            價格 × <span className="font-hand text-2xl text-accent">{map.yAxisLabel}</span>
          </h4>
        </div>
        <div className="font-mono-ui text-[10px] uppercase tracking-wider text-ink/60 whitespace-nowrap">
          排名 {brandRank}/{total}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
        {[25, 50, 75].map((p) => (
          <g key={`g-${p}`}>
            <line x1={toX(p)} y1={PAD} x2={toX(p)} y2={H - PAD} stroke="hsl(var(--ink))" strokeOpacity="0.1" strokeDasharray="3 5" />
            <line x1={PAD} y1={toY(p)} x2={W - PAD} y2={toY(p)} stroke="hsl(var(--ink))" strokeOpacity="0.1" strokeDasharray="3 5" />
          </g>
        ))}

        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="hsl(var(--ink))" strokeWidth="2.5" strokeLinecap="round" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="hsl(var(--ink))" strokeWidth="2.5" strokeLinecap="round" />

        <polygon points={`${W - PAD},${H - PAD - 6} ${W - PAD + 10},${H - PAD} ${W - PAD},${H - PAD + 6}`} fill="hsl(var(--ink))" />
        <polygon points={`${PAD - 6},${PAD} ${PAD},${PAD - 10} ${PAD + 6},${PAD}`} fill="hsl(var(--ink))" />

        <text x={W - PAD} y={H - PAD + 26} textAnchor="end" style={{ fontSize: 12, fontFamily: "Caveat, cursive", fill: "hsl(var(--ink))" }}>
          價格 →
        </text>
        <text x={PAD} y={PAD - 14} textAnchor="start" style={{ fontSize: 12, fontFamily: "Caveat, cursive", fill: "hsl(var(--ink))" }}>
          ↑ {map.yAxisLabel}
        </text>

        {points.map((p, i) => (
          <g key={i}>
            {p.isBrand ? (
              <>
                <circle
                  cx={toX(p.x)}
                  cy={toY(p.y)}
                  r="14"
                  fill={isCore ? "hsl(var(--accent))" : "hsl(var(--sticky-yellow))"}
                  stroke="hsl(var(--ink))"
                  strokeWidth="2.5"
                />
                <text
                  x={toX(p.x)}
                  y={toY(p.y) - 22}
                  textAnchor="middle"
                  style={{ fontSize: 13, fontWeight: 700, fill: "hsl(var(--ink))", fontFamily: "Fraunces, serif" }}
                >
                  {p.name}
                </text>
              </>
            ) : (
              <>
                <circle cx={toX(p.x)} cy={toY(p.y)} r="6" fill="hsl(var(--paper))" stroke="hsl(var(--ink))" strokeWidth="2" />
                <text x={toX(p.x) + 11} y={toY(p.y) + 4} style={{ fontSize: 11, fill: "hsl(var(--ink) / 0.75)" }}>
                  {p.name}
                </text>
              </>
            )}
          </g>
        ))}
      </svg>

      <div className="mt-3 p-3 rounded-xl border-2 border-dashed border-ink/25 bg-paper/60">
        <span className="font-hand text-base text-accent mr-1">洞察 ✦</span>
        <span className="text-xs leading-relaxed text-ink/85">{map.insight}</span>
      </div>
    </div>
  );
};

interface Props {
  positioning: PositioningAnalysis;
}

export const PositioningChart = ({ positioning }: Props) => {
  const [showAll, setShowAll] = useState(true);
  const coreLabels = new Set(positioning.coreCompetencies.yAxisLabels);

  const ordered = [...positioning.maps].sort((a, b) => {
    const aCore = coreLabels.has(a.yAxisLabel) ? 0 : 1;
    const bCore = coreLabels.has(b.yAxisLabel) ? 0 : 1;
    if (aCore !== bCore) return aCore - bCore;
    return b.brand.y - a.brand.y;
  });

  const visible = showAll ? ordered : ordered.filter((m) => coreLabels.has(m.yAxisLabel));

  return (
    <div className="space-y-8">
      <div className="text-center">
        <span className="font-hand text-3xl text-accent">positioning map</span>
        <h3 className="font-display text-3xl md:text-4xl text-ink mt-1">
          多維度<span className="doodle-underline">市場定位</span>
        </h3>
        <p className="mt-3 max-w-2xl mx-auto text-sm leading-relaxed text-ink/70">
          以價格為 X 軸，從 {positioning.maps.length} 個正向變數出發，與市場主要競爭者一同定位。
          在最多維度上佔據高點的，才是真正的市場利基。
        </p>
      </div>

      {/* Core competencies callout */}
      <div className="paper-card-lg p-6 md:p-8 bg-sticky-yellow relative">
        <span className="tape" />
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">⭐</span>
          <span className="font-hand text-2xl text-ink">核心競爭力 Core Competencies</span>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mb-4">
          {positioning.coreCompetencies.yAxisLabels.map((label, i) => (
            <span key={label} className="font-display text-2xl md:text-3xl text-ink">
              {i > 0 && <span className="text-accent mr-3">×</span>}
              {label}
            </span>
          ))}
        </div>
        <p className="text-sm md:text-base leading-relaxed text-ink/85 text-balance">
          {positioning.coreCompetencies.summary}
        </p>
      </div>

      {/* Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAll(!showAll)}
          className="chip bg-card hover:bg-sticky-yellow transition-colors"
        >
          {showAll ? "🎯 只看核心" : `🔍 看全部 ${positioning.maps.length} 個維度`}
        </button>
      </div>

      {/* Grid of maps */}
      <div className="grid gap-6 md:grid-cols-2">
        {visible.map((m) => {
          const isCore = coreLabels.has(m.yAxisLabel);
          const rank = isCore ? positioning.coreCompetencies.yAxisLabels.indexOf(m.yAxisLabel) + 1 : undefined;
          return <SingleChart key={m.yAxisLabel} map={m} isCore={isCore} rank={rank} />;
        })}
      </div>
    </div>
  );
};
