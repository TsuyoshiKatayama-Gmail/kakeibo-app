// レシートの読み取り結果に警告がある場合に表示する確認・修正ダイアログ
// 重複や負の金額などの警告を表示しつつ、店舗名・商品名などをその場で修正できる。
import { useMemo, useState } from "react";
import { CATEGORIES } from "../utils/categories.js";

export default function ReceiptEditModal({ record, warnings, onConfirm, onCancel }) {
  // 編集用のローカル状態（record を複製して保持）
  const [date, setDate] = useState(record.date || "");
  const [store, setStore] = useState(record.store || "");
  const [items, setItems] = useState(() =>
    (record.items || []).map((it) => ({
      name: it.name || "",
      price: it.price ?? 0,
      category: it.category || "その他",
    }))
  );

  // 合計は商品明細の金額から自動計算する
  const total = useMemo(
    () => items.reduce((s, it) => s + (Number(it.price) || 0), 0),
    [items]
  );

  function updateItem(index, key, value) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [key]: value } : it))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { name: "", price: 0, category: "その他" }]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleConfirm() {
    const fixed = {
      ...record,
      date: date.trim() || new Date().toISOString().slice(0, 10),
      store: store.trim() || "（店舗名不明）",
      items: items.map((it) => ({
        name: it.name.trim(),
        price: Number(it.price) || 0,
        category: it.category || "その他",
      })),
      total,
    };
    onConfirm(fixed);
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="レシートの確認・修正"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="modal-title">⚠️ 読み取り結果の確認</h3>

        {warnings.length > 0 && (
          <div className="warnings">
            <span className="warnings-title">検証警告</span>
            <ul>
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="modal-hint">
          内容を確認し、必要に応じて修正してから登録してください。
        </p>

        <div className="modal-field">
          <label>日付</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="modal-field">
          <label>店舗名</label>
          <input
            type="text"
            value={store}
            placeholder="店舗名を入力"
            onChange={(e) => setStore(e.target.value)}
          />
        </div>

        <div className="modal-field">
          <label>商品明細</label>
          <table className="modal-items">
            <thead>
              <tr>
                <th>商品名</th>
                <th>カテゴリ</th>
                <th className="right">金額</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    商品がありません。「商品を追加」で入力してください。
                  </td>
                </tr>
              )}
              {items.map((it, i) => (
                <tr key={i}>
                  <td>
                    <input
                      type="text"
                      value={it.name}
                      placeholder="商品名を入力"
                      onChange={(e) => updateItem(i, "name", e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      value={it.category}
                      onChange={(e) => updateItem(i, "category", e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="right">
                    <input
                      type="number"
                      className="price-input"
                      value={it.price}
                      onChange={(e) => updateItem(i, "price", e.target.value)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="delete"
                      onClick={() => removeItem(i)}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="add-item" onClick={addItem}>
            ＋ 商品を追加
          </button>
        </div>

        <div className="modal-total">
          合計: <strong>¥{total.toLocaleString()}</strong>
        </div>

        <div className="modal-actions">
          <button type="button" className="cancel" onClick={onCancel}>
            キャンセル
          </button>
          <button type="button" className="primary" onClick={handleConfirm}>
            この内容で登録
          </button>
        </div>
      </div>
    </div>
  );
}
