import { BrandPyramid } from "@/types/pyramid";

interface Props {
  pyramid: BrandPyramid;
  audience: "external" | "internal";
}

const STICKY_COLORS = ["bg-sticky-yellow", "bg-sticky-pink", "bg-sticky-blue", "bg-sticky-green", "bg-sticky-orange", "bg-sticky-purple"];
const ROTATIONS = ["rotate-[-1.2deg]", "rotate-[1deg]", "rotate-[-0.6deg]", "rotate-[1.4deg]", "rotate-[-0.4deg]", "rotate-[0.8deg]"];

export const PyramidView = ({ pyramid, audience }: Props) => {
  const vision = pyramid.vision[audience];
  const mission = pyramid.mission[audience];
  const values = pyramid.values[audience];

  return (
    <div className="space-y-10">
      {/* Vision tier — top */}
      <div className="mx-auto w-full max-w-xl animate-float-up">
        <div className="paper-card-lg p-7 bg-sticky-yellow relative">
          <span className="tape" />
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🌅</span>
            <span className="font-hand text-2xl text-ink">願景 Vision</span>
          </div>
          <p className="font-display text-2xl md:text-3xl leading-snug text-ink text-balance">
            {vision}
          </p>
        </div>
      </div>

      {/* Connector */}
      <div className="flex justify-center">
        <div className="font-hand text-4xl text-ink/40">↓</div>
      </div>

      {/* Mission tier — middle */}
      <div className="mx-auto w-full max-w-3xl animate-float-up" style={{ animationDelay: "120ms" }}>
        <div className="paper-card-lg p-7 bg-sticky-pink relative">
          <span className="tape tape-pink" />
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎯</span>
            <span className="font-hand text-2xl text-ink">使命 Mission</span>
          </div>
          <p className="font-display text-xl md:text-2xl leading-snug text-ink text-balance">
            {mission}
          </p>
        </div>
      </div>

      {/* Connector */}
      <div className="flex justify-center">
        <div className="font-hand text-4xl text-ink/40">↓</div>
      </div>

      {/* Values tier — bottom, wide grid */}
      <div className="w-full animate-float-up" style={{ animationDelay: "240ms" }}>
        <div className="paper-card-lg p-7 bg-card">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">🧭</span>
            <span className="font-hand text-2xl text-ink">價值觀 Values</span>
            <span className="ml-auto chip bg-sticky-green text-ink">
              共 {values.length} 條
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {values.map((v, i) => (
              <div
                key={i}
                className={`sticky-note ${STICKY_COLORS[i % STICKY_COLORS.length]} ${ROTATIONS[i % ROTATIONS.length]}`}
              >
                <div className="font-display text-xl text-ink leading-tight">
                  {v.name}
                </div>
                <div className="mt-2 text-sm leading-relaxed text-ink/85">
                  {v.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
