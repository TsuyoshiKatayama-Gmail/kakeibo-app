// 登録済みのレシート（商品名・金額・日付）を一覧表示するコンポーネント
import { colorFor } from "../utils/categories.js";

export default function ExpenseList({ records, onDelete }) {
  if (records.length === 0) {
    return (
      <section className="card">
        <h2>登録データ</h2>
        <p className="muted">まだデータがありません。レシートを読み込んでください。</p>
      </section>
    );
  }

  // 日付の新しい順に並べる
  const sorted = [...records].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <section className="card">
      <h2>登録データ</h2>
      {sorted.map((rec) => (
        <div key={rec.id} className="record">
          <div className="record-header">
            <div>
              <span className="record-date">{rec.date}</span>
              <span className="record-store">{rec.store}</span>
            </div>
            <div className="record-header-right">
              <span className="record-total">¥{rec.total.toLocaleString()}</span>
              <button
                className="delete"
                onClick={() => onDelete(rec.id)}
                title="このレシートを削除"
              >
                削除
              </button>
            </div>
          </div>
          <table className="items">
            <thead>
              <tr>
                <th>商品名</th>
                <th>カテゴリ</th>
                <th className="right">金額</th>
              </tr>
            </thead>
            <tbody>
              {rec.items.map((it, i) => (
                <tr key={i}>
                  <td>{it.name}</td>
                  <td>
                    <span
                      className="badge"
                      style={{ backgroundColor: colorFor(it.category) }}
                    >
                      {it.category}
                    </span>
                  </td>
                  <td className="right">¥{(it.price || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}
