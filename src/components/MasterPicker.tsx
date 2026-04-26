import { Master, GROUPED_MASTERS, MasterGroup } from "@/lib/masters";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (id: string) => void;
}

const GROUP_META: Record<MasterGroup, { title: string; emoji: string; tape: "yellow" | "pink" | "blue" }> = {
  marketing: { title: "行銷大師", emoji: "📣", tape: "yellow" },
  founder: { title: "創業 × 設計", emoji: "✨", tape: "pink" },
  chinese: { title: "華人企業家", emoji: "🏮", tape: "blue" },
};

const COLOR_BG: Record<Master["color"], string> = {
  yellow: "bg-sticky-yellow",
  pink: "bg-sticky-pink",
  blue: "bg-sticky-blue",
  green: "bg-sticky-green",
  orange: "bg-sticky-orange",
  purple: "bg-sticky-purple",
};

export const MasterPicker = ({ value, onChange }: Props) => {
  return (
    <div className="space-y-8">
      {(Object.keys(GROUPED_MASTERS) as MasterGroup[]).map((group) => {
        const meta = GROUP_META[group];
        return (
          <div key={group}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{meta.emoji}</span>
              <span className="font-hand text-2xl text-ink">{meta.title}</span>
              <span className="flex-1 h-0.5 bg-ink/15" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {GROUPED_MASTERS[group].map((m) => {
                const active = value === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onChange(m.id)}
                    className={cn(
                      "sticky-note text-left",
                      active ? COLOR_BG[m.color] : "bg-card",
                      active && "ring-2 ring-ink ring-offset-2 ring-offset-background"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl leading-none mt-0.5">{m.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-lg text-ink leading-tight">
                          {m.name}
                        </div>
                        <div className="font-mono-ui text-[10px] uppercase tracking-wider text-ink/60 mt-1">
                          {m.tag}
                        </div>
                        <div className="text-xs text-ink/80 leading-relaxed mt-2">
                          {m.description}
                        </div>
                      </div>
                    </div>
                    {active && (
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-ink text-paper border-2 border-ink flex items-center justify-center text-sm font-bold shadow-[2px_2px_0_hsl(var(--accent))]">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
