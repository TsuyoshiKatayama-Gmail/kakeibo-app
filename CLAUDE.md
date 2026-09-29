# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

kakeibo-app はレシート画像を読み込んで自動記録する家計簿 Web アプリです（Claude Code 研修用プロジェクト）。
レシート画像をアップロードすると Claude API（Vision）が商品名・金額・日付を読み取り、
カテゴリ別に自動分類する。集計結果は Chart.js の円グラフ・棒グラフで可視化し、
データはブラウザの localStorage に保存する。

技術スタック:
- フロントエンド: React + Vite（`client/`）、グラフは Chart.js / react-chartjs-2
- バックエンド: Node.js + Express（`server.js`）。Claude API はここから呼び出す
- モデル: `claude-haiku-4-5`（claude-haiku の最新バージョン）
- API キー: `.env` の `ANTHROPIC_API_KEY` で管理（`.gitignore` 済み。ブラウザからは直接使わない）

## Git 運用ルール（重要）

**コードを変更するたびに、その都度 GitHub にプッシュすること。**

- 意味のあるまとまり（1つの機能・修正）ごとにコミットし、コミット後すぐに `git push` する。
- 変更を溜め込まず、こまめにコミット・プッシュして作業履歴を GitHub 上に残す。
- コミットメッセージは変更内容が分かる日本語で簡潔に書く。

基本の流れ:

```bash
git add -A
git commit -m "変更内容を説明するメッセージ"
git push
```

初回セットアップ（まだ Git リポジトリではない場合）:

```bash
git init
git add -A
git commit -m "初回コミット"
git branch -M main
git remote add origin <GitHubリポジトリのURL>
git push -u origin main
```

## 開発コマンド

初回セットアップ:

```bash
# 依存パッケージをまとめてインストール（ルート + client/）
npm run install:all

# .env を作成して API キーを設定
cp .env.example .env   # ANTHROPIC_API_KEY を編集
```

開発サーバー起動:

```bash
# バックエンド(3001) と フロントエンド(5173) を同時起動
npm run dev

# 個別に起動する場合
npm run server   # Express バックエンドのみ（node --watch）
npm run client   # Vite 開発サーバーのみ
```

開発サーバー停止:

```bash
# フォアグラウンドで起動している場合は Ctrl+C で両方停止

# バックグラウンド起動時など、ポートを掴んだままのプロセスを停止する場合
lsof -ti:3001,5173 | xargs kill   # 3001=バックエンド, 5173=フロント
```

その他:

```bash
npm run build    # フロントエンドを本番ビルド（client/dist）
```

ブラウザは http://localhost:5173 を開く。Vite が `/api/*` をバックエンド(3001)へプロキシする。
テスト・Lint は未導入。

デプロイ（Web公開）:

本番では Express がフロントのビルド成果物（`client/dist`）も配信するため、1サービスで公開できる。
ビルドは `npm run build`、起動は `npm start`。環境変数 `ANTHROPIC_API_KEY`（必須）と
`APP_PASSWORD`（設定すると Basic 認証でアクセス制限。公開時は必須推奨）を使う。
Render 用の `render.yaml` と詳細手順は [DEPLOY.md](DEPLOY.md) を参照。

## コード構成

データフロー:
1. `client/` の `ReceiptUploader` が画像を base64 化し、`POST /api/analyze-receipt` へ送信
2. `server.js` が Claude API（Vision + 構造化出力 `output_config.format`）を呼び、
   `{ date, store, items:[{name, price, category}], total }` を返す
3. フロント側で家計簿レコード化し、`App` の state と `localStorage`（`utils/storage.js`）に保存
4. `Charts`（Chart.js）がカテゴリ別（円）・月別（棒）に集計して表示、`ExpenseList` が明細を一覧表示

主要ファイル:
- `server.js` — Express サーバー。`/api/analyze-receipt`（Claude呼び出し）、`/api/categories`、`/api/health`
- `client/src/App.jsx` — 状態管理と localStorage 同期のルートコンポーネント
- `client/src/components/` — `ReceiptUploader` / `ExpenseList` / `Charts`
- `client/src/utils/` — `storage.js`（永続化）/ `categories.js`（カテゴリ定義・色）/ `image.js`（base64変換）

カテゴリ定義は `server.js` の `CATEGORIES` と `client/src/utils/categories.js` の両方にあり、
変更時は両方を一致させること。

## 言語

やり取り・コミットメッセージ・コメントは日本語で行う。
