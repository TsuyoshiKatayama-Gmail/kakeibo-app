// 家計簿レコードの検証ロジック
// 追加しようとするレコードに問題がないか確認し、警告メッセージの配列を返す。
// 警告があっても登録自体は禁止しない（ユーザーに確認を促す）。

// 店舗名が読み取れなかったとみなす値
const UNKNOWN_STORE = "（店舗名不明）";

export function validateRecord(record, existingRecords = []) {
  const warnings = [];

  // 0. 店舗名が読み取れなかった場合
  const storeName = (record.store || "").trim();
  if (storeName === "" || storeName === UNKNOWN_STORE) {
    warnings.push(
      "店舗名が読み取れませんでした。画像を確認するか、手動で修正してください。"
    );
  }

  // 0-2. 商品名が読み取れなかった場合（明細なし、または名前が空の商品がある）
  const items = record.items || [];
  if (items.length === 0) {
    warnings.push(
      "商品が読み取れませんでした。画像を確認するか、手動で修正してください。"
    );
  } else {
    const namelessCount = items.filter((it) => !(it.name || "").trim()).length;
    if (namelessCount > 0) {
      warnings.push(
        `商品名が読み取れない項目が ${namelessCount} 件あります。` +
          "画像を確認するか、手動で修正してください。"
      );
    }
  }

  // 1. 金額が負の値になっていないか（合計・各商品）
  const negativeItems = (record.items || []).filter((it) => (it.price ?? 0) < 0);
  if (record.total < 0 || negativeItems.length > 0) {
    const names = negativeItems.map((it) => it.name).filter(Boolean);
    warnings.push(
      "金額が負の値になっています" +
        (names.length > 0 ? `（${names.join("、")}）` : "") +
        "。読み取り結果を確認してください。"
    );
  }

  // 2. 同一の日付・合計金額のレシートが既に登録されていないか（重複の可能性）
  const isDuplicate = existingRecords.some(
    (r) => r.date === record.date && r.total === record.total
  );
  if (isDuplicate) {
    warnings.push(
      `同じ日付（${record.date}）・合計金額（¥${record.total.toLocaleString()}）の` +
        "レシートが既に登録されています。重複の可能性があります。"
    );
  }

  return warnings;
}
