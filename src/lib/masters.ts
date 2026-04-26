export type MasterGroup = "marketing" | "founder" | "chinese";

export interface Master {
  id: string;
  name: string;
  group: MasterGroup;
  groupLabel: string;
  tag: string;
  description: string;
  emoji: string;
  color: "yellow" | "pink" | "blue" | "green" | "orange" | "purple";
}

export const MASTERS: Master[] = [
  // 行銷大師組
  { id: "kotler", name: "Philip Kotler", group: "marketing", groupLabel: "行銷大師", tag: "現代行銷學之父", description: "市場區隔、價值主張、嚴謹系統化的語言。", emoji: "📊", color: "blue" },
  { id: "aaker", name: "David Aaker", group: "marketing", groupLabel: "行銷大師", tag: "品牌權益理論", description: "品牌資產、聯想、感知品質，重結構與層次。", emoji: "🏗️", color: "purple" },
  { id: "ries", name: "Al Ries", group: "marketing", groupLabel: "行銷大師", tag: "定位之父", description: "心智佔有、第一法則、聚焦單一概念。", emoji: "🎯", color: "pink" },
  // 創業/設計組
  { id: "sinek", name: "Simon Sinek", group: "founder", groupLabel: "創業設計", tag: "Start With Why", description: "從 WHY 出發，富感染力、信念導向。", emoji: "💡", color: "yellow" },
  { id: "jobs", name: "Steve Jobs", group: "founder", groupLabel: "創業設計", tag: "極簡主義", description: "去除多餘，最少的字，最強的信念。", emoji: "🍎", color: "green" },
  { id: "muji", name: "原研哉 × 無印良品", group: "founder", groupLabel: "創業設計", tag: "這樣就好", description: "剛剛好、留白、東方禪意。", emoji: "🌿", color: "green" },
  // 華人企業家組
  { id: "jobs_chinese", name: "東方賈伯斯式", group: "chinese", groupLabel: "華人企業家", tag: "禪式中文", description: "精煉、內斂、有東方哲學的力量。", emoji: "☯️", color: "purple" },
  { id: "wu_chingyou", name: "吳清友 × 誠品", group: "chinese", groupLabel: "華人企業家", tag: "人文書店", description: "閱讀照亮生命，溫潤、文化感重。", emoji: "📚", color: "orange" },
  { id: "wang_pin_dai", name: "戴勝益 × 王品", group: "chinese", groupLabel: "華人企業家", tag: "敢拚能賺愛玩", description: "直白、有人情味、團隊感強。", emoji: "🍷", color: "pink" },
];

export const GROUPED_MASTERS: Record<MasterGroup, Master[]> = {
  marketing: MASTERS.filter((m) => m.group === "marketing"),
  founder: MASTERS.filter((m) => m.group === "founder"),
  chinese: MASTERS.filter((m) => m.group === "chinese"),
};
