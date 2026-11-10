// レシート読み込み家計簿アプリのバックエンドサーバー
// ブラウザから直接 Gemini API を呼ばず、この Node.js サーバーを経由させることで
// API キーをサーバー側だけに保持する（.env で管理し .gitignore 済み）。

import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 3001;

// このファイルのあるディレクトリ（ESM には __dirname が無いため導出する）
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// フロントエンドの本番ビルド成果物の場所
const CLIENT_DIST = path.join(__dirname, "client", "dist");

// 使用するモデル（Gemini の Vision 対応モデル）
const MODEL = "gemini-2.5-flash";

// カテゴリの候補。Gemini にはこの一覧から必ず1つを選ばせる。
const CATEGORIES = [
  "食費",
  "日用品",
  "外食",
  "交通費",
  "娯楽",
  "衣類",
  "医療・健康",
  "その他",
];

// API キーが無い場合は起動時に警告する
if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "[警告] 環境変数 GEMINI_API_KEY が未設定です。.env.example をコピーして .env を作成してください。"
  );
}

// Gemini クライアント（GEMINI_API_KEY を使用）
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors());

// 簡易パスワード保護（Basic 認証）
// 環境変数 APP_PASSWORD を設定した場合のみ有効になる。
// 公開デプロイ時に第三者へ API キー経由の課金利用をされないための最小限の防御。
if (process.env.APP_PASSWORD) {
  app.use((req, res, next) => {
    const header = req.headers.authorization || "";
    const [scheme, encoded] = header.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString();
      // "user:password" 形式。パスワード部分（コロン以降）を照合する。
      const password = decoded.slice(decoded.indexOf(":") + 1);
      if (password === process.env.APP_PASSWORD) {
        return next();
      }
    }
    res.set("WWW-Authenticate", 'Basic realm="kakeibo"');
    return res.status(401).send("認証が必要です。");
  });
}

// 画像は base64 で送られてくるためリクエストサイズの上限を広げる
app.use(express.json({ limit: "25mb" }));

// フロントエンドの本番ビルドを静的配信する（本番環境用）
// 開発時は Vite(5173) が配信するためこの経路は使われない。
app.use(express.static(CLIENT_DIST));

// Gemini に返させる構造化データのスキーマ（responseSchema）
// ※ Gemini の responseSchema は additionalProperties 非対応のため付けない。
const RECEIPT_SCHEMA = {
  type: "object",
  properties: {
    date: {
      type: "string",
      description: "レシートの購入日。YYYY-MM-DD 形式。読み取れない場合は空文字。",
    },
    store: {
      type: "string",
      description: "店舗名。読み取れない場合は空文字。",
    },
    items: {
      type: "array",
      description: "購入した商品の一覧",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "商品名" },
          price: { type: "number", description: "税込みの金額（円）" },
          category: {
            type: "string",
            enum: CATEGORIES,
            description: "商品のカテゴリ",
          },
        },
        required: ["name", "price", "category"],
      },
    },
    total: {
      type: "number",
      description: "合計金額（円）。読み取れない場合は商品の合計。",
    },
  },
  required: ["date", "store", "items", "total"],
};

// レシート解析エンドポイント
// リクエストボディ: { imageBase64: string, mediaType: string }
app.post("/api/analyze-receipt", async (req, res) => {
  try {
    const { imageBase64, mediaType } = req.body;

    if (!imageBase64 || !mediaType) {
      return res
        .status(400)
        .json({ error: "画像データ（imageBase64）と mediaType が必要です。" });
    }

    // Gemini API に画像を渡して内容を読み取らせる
    const response = await genAI.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mediaType,
                data: imageBase64,
              },
            },
            {
              text:
                "これは日本のレシート画像です。購入日・店舗名・各商品の商品名と金額を読み取り、" +
                "各商品を次のカテゴリのいずれかに分類してください: " +
                CATEGORIES.join("、") +
                "。金額は税込みの数値（円）で返してください。判別できない項目は無理に推測せず、" +
                "日付や店舗名が不明なら空文字にしてください。",
            },
          ],
        },
      ],
      // 構造化出力でスキーマに沿った JSON を必ず返させる
      config: {
        responseMimeType: "application/json",
        responseSchema: RECEIPT_SCHEMA,
      },
    });

    // responseMimeType: application/json の場合、text にスキーマ準拠の JSON が入る
    const text = response.text;
    if (!text) {
      return res
        .status(502)
        .json({ error: "Gemini から有効な応答が得られませんでした。" });
    }

    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err) {
    console.error("レシート解析エラー:", err);
    // Google GenAI SDK のエラーはステータスコードを持つ場合がある
    const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
    res.status(status).json({
      error: "レシートの解析に失敗しました。",
      detail: err?.message ?? String(err),
    });
  }
});

// カテゴリ一覧を返すエンドポイント（フロントエンドと定義を共有するため）
app.get("/api/categories", (_req, res) => {
  res.json({ categories: CATEGORIES });
});

// 動作確認用のヘルスチェック
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: MODEL });
});

// SPA フォールバック: /api 以外の GET は index.html を返す（本番配信用）
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    return res.sendFile(path.join(CLIENT_DIST, "index.html"), (err) => {
      // ビルド未実施（開発時など）は次のハンドラへ
      if (err) next();
    });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`家計簿バックエンドを起動しました: http://localhost:${PORT}`);
});
