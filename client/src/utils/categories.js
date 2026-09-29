// カテゴリの定義とグラフ用の色。
// バックエンド（server.js の CATEGORIES）と一致させること。

export const CATEGORIES = [
  "食費",
  "日用品",
  "外食",
  "交通費",
  "娯楽",
  "衣類",
  "医療・健康",
  "その他",
];

// カテゴリごとの表示色（円グラフ・凡例で使用）
export const CATEGORY_COLORS = {
  食費: "#ff6b6b",
  日用品: "#4dabf7",
  外食: "#ffd43b",
  交通費: "#69db7c",
  娯楽: "#da77f2",
  衣類: "#ff922b",
  "医療・健康": "#38d9a9",
  その他: "#adb5bd",
};

// 未知のカテゴリが来た場合のフォールバック色
export function colorFor(category) {
  return CATEGORY_COLORS[category] || "#adb5bd";
}
