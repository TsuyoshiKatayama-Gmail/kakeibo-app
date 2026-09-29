// レシート画像をアップロードして Claude API で解析するコンポーネント
import { useState } from "react";
import { fileToBase64 } from "../utils/image.js";
import { validateRecord } from "../utils/validation.js";
import ReceiptEditModal from "./ReceiptEditModal.jsx";

export default function ReceiptUploader({ onAdd, records }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [warnings, setWarnings] = useState([]);
  // 警告がある場合に確認・修正ダイアログで扱う一時レコード
  const [pending, setPending] = useState(null);
  // 直近に登録したフォーム input（登録確定時にリセットするため保持）
  const [formEl, setFormEl] = useState(null);

  // ファイル選択時にプレビューを表示
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    setError("");
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl("");
    }
  }

  // 解析ボタン押下時の処理
  async function handleAnalyze(e) {
    e.preventDefault();
    const input = e.target.elements.receipt;
    const file = input.files?.[0];
    if (!file) {
      setError("レシート画像を選択してください。");
      return;
    }

    setLoading(true);
    setError("");
    setWarnings([]);
    try {
      // 画像を base64 に変換してバックエンドへ送信
      const { base64, mediaType } = await fileToBase64(file);
      const res = await fetch("/api/analyze-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `解析に失敗しました (HTTP ${res.status})`);
      }

      const data = await res.json();

      // 家計簿レコードを作成して親に渡す
      const record = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: data.date || new Date().toISOString().slice(0, 10),
        store: data.store || "（店舗名不明）",
        items: Array.isArray(data.items) ? data.items : [],
        total:
          typeof data.total === "number" && data.total > 0
            ? data.total
            : (data.items || []).reduce((s, it) => s + (it.price || 0), 0),
        createdAt: Date.now(),
      };

      // データ検証（店舗名・商品名の欠損・負の金額・重複レシート）
      const foundWarnings = validateRecord(record, records);
      setWarnings(foundWarnings);
      if (foundWarnings.length > 0) {
        // 警告がある場合は確認・修正ダイアログを表示（登録は保留）
        setPending(record);
        setFormEl(input);
        return;
      }

      onAdd(record);

      // フォームとプレビューをリセット
      input.value = "";
      setPreviewUrl("");
    } catch (err) {
      setError(err.message || "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  // ダイアログで修正内容を確定して登録
  function handleConfirmPending(fixedRecord) {
    onAdd(fixedRecord);
    setPending(null);
    setWarnings([]);
    if (formEl) formEl.value = "";
    setFormEl(null);
    setPreviewUrl("");
  }

  // ダイアログをキャンセル（画像は残して再確認できるようにする）
  function handleCancelPending() {
    setPending(null);
  }

  return (
    <section className="card">
      <h2>レシートを読み込む</h2>
      <form onSubmit={handleAnalyze}>
        <input
          type="file"
          name="receipt"
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading}
        />
        {previewUrl && (
          <div className="preview">
            <img src={previewUrl} alt="レシートのプレビュー" />
          </div>
        )}
        <button type="submit" disabled={loading} className="primary">
          {loading ? "解析中…" : "解析して登録"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {warnings.length > 0 && !pending && (
        <div className="warnings">
          <span className="warnings-title">⚠️ 検証警告</span>
          <ul>
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      {pending && (
        <ReceiptEditModal
          record={pending}
          warnings={warnings}
          onConfirm={handleConfirmPending}
          onCancel={handleCancelPending}
        />
      )}
    </section>
  );
}
