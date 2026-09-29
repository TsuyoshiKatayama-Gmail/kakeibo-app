// 家計簿レコードの検証ロジック
// 追加しようとするレコードに問題がないか確認し、警告メッセージの配列を返す。
// 警告があっても登録自体は禁止しない（ユーザーに確認を促す）。

export function validateRecord(record, existingRecords = []) {
  const warnings = [];

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
