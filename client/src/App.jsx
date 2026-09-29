// アプリ全体のルートコンポーネント
// レシートの状態を管理し、localStorage と同期する。
import { useEffect, useMemo, useState } from "react";
import ReceiptUploader from "./components/ReceiptUploader.jsx";
import ExpenseList from "./components/ExpenseList.jsx";
import Charts from "./components/Charts.jsx";
import { loadRecords, saveRecords } from "./utils/storage.js";

export default function App() {
  // 初回レンダリング時に localStorage から読み込む
  const [records, setRecords] = useState(() => loadRecords());

  // records が変わるたびに localStorage へ保存（リロードしても消えない）
  useEffect(() => {
    saveRecords(records);
  }, [records]);

  // レシートを追加
  function handleAdd(record) {
    setRecords((prev) => [record, ...prev]);
  }

  // レシートを削除
  function handleDelete(id) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  // 全体の合計金額
  const grandTotal = useMemo(
    () => records.reduce((s, r) => s + (r.total || 0), 0),
    [records]
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧾 レシート家計簿</h1>
        <p className="subtitle">
          レシート画像をアップロードすると Claude が自動で読み取り・分類します。
        </p>
        {records.length > 0 && (
          <p className="grand-total">
            合計支出: <strong>¥{grandTotal.toLocaleString()}</strong>
            （{records.length} 件）
          </p>
        )}
      </header>

      <main>
        <ReceiptUploader onAdd={handleAdd} records={records} />
        <Charts records={records} />
        <ExpenseList records={records} onDelete={handleDelete} />
      </main>

      <footer className="app-footer">
        <small>研修用サンプル / モデル: claude-haiku-4-5</small>
      </footer>
    </div>
  );
}
