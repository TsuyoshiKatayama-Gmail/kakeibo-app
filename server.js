// レシート読み込み家計簿アプリのバックエンドサーバー
// ブラウザから直接 Claude API を呼ばず、この Node.js サーバーを経由させることで
// API キーをサーバー側だけに保持する（.env で管理し .gitignore 済み）。

import "dotenv/config";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
const PORT = process.env.PORT || 3001;

// 使用するモデル（claude-haiku の最新バージョン）
const MODEL = "claude-haiku-4-5";

// カテゴリの候補。Claude にはこの一覧から必ず1つを選ばせる。
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
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn(
    "[警告] 環境変数 ANTHROPIC_API_KEY が未設定です。.env.example をコピーして .env を作成してください。"
  );
}

// Anthropic クライアント（ANTHROPIC_API_KEY を自動で読み込む）
const anthropic = new Anthropic();

// 画像は base64 で送られてくるためリクエストサイズの上限を広げる
app.use(cors());
app.use(express.json({ limit: "25mb" }));

// Claude に返させる構造化データのスキーマ（構造化出力）
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
        additionalProperties: false,
      },
    },
    total: {
      type: "number",
      description: "合計金額（円）。読み取れない場合は商品の合計。",
    },
  },
  required: ["date", "store", "items", "total"],
  additionalProperties: false,
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

    // Claude API に画像を渡して内容を読み取らせる
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      // 構造化出力でスキーマに沿った JSON を必ず返させる
      output_config: {
        format: {
          type: "json_schema",
          schema: RECEIPT_SCHEMA,
        },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: "text",
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
    });

    // 構造化出力の場合、最初のテキストブロックに有効な JSON が入っている
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock) {
      return res
        .status(502)
        .json({ error: "Claude から有効な応答が得られませんでした。" });
    }

    const parsed = JSON.parse(textBlock.text);
    res.json(parsed);
  } catch (err) {
    console.error("レシート解析エラー:", err);
    // Anthropic SDK のエラーはステータスコードを持つ場合がある
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

app.listen(PORT, () => {
  console.log(`家計簿バックエンドを起動しました: http://localhost:${PORT}`);
});
