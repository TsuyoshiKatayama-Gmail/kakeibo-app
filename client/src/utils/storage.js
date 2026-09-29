// localStorage を使ったデータ永続化ユーティリティ
// レシート（家計簿の1件）の配列を保存・読み込みする。

const STORAGE_KEY = "kakeibo-records";

// 保存済みのレシート一覧を読み込む
export function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("保存データの読み込みに失敗しました:", e);
    return [];
  }
}

// レシート一覧を保存する
export function saveRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error("保存データの書き込みに失敗しました:", e);
  }
}
