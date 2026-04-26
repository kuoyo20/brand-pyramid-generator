export interface ValueItem {
  name: string;
  description: string;
}

export interface AudienceLayer {
  external: string;
  internal: string;
}

export interface ValuesLayer {
  external: ValueItem[];
  internal: ValueItem[];
}

export interface CompetitorPoint {
  name: string;
  x: number;
  y: number;
}

export interface PositioningMap {
  xAxisLabel: string;
  yAxisLabel: string;
  yAxisRationale: string;
  brand: { x: number; y: number };
  competitors: CompetitorPoint[];
  insight: string;
}

export interface PositioningAnalysis {
  maps: PositioningMap[];
  coreCompetencies: {
    yAxisLabels: string[];
    summary: string;
  };
}

export interface BrandPyramid {
  companyName: string;
  tagline: string;
  vision: AudienceLayer;
  mission: AudienceLayer;
  values: ValuesLayer;
  positioning: PositioningAnalysis;
}

export interface CompanyProfile {
  name: string;
  industry: string;
  description: string;
  products: string[];
  customers: string;
  differentiators: string[];
  confidence: "high" | "medium" | "low";
}
