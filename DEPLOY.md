# デプロイ手順（Web公開）

このアプリは **Node.js バックエンド + React フロントエンド** の構成です。
本番では Express が React のビルド成果物も配信するため、**1つのサービス**として公開できます。

> ⚠️ **重要 — API課金のリスク**
> このアプリはバックエンドで Claude API を呼び出します。認証なしで公開すると、
> URL を知る第三者が自由にレシート解析を実行でき、**あなたの API キーで課金が発生**します。
> 公開時は必ず環境変数 `APP_PASSWORD` を設定し、簡易パスワード保護を有効にしてください。

---

## Render で公開する（推奨・無料枠あり）

リポジトリに [`render.yaml`](render.yaml) を用意済みなので、接続するだけで設定が読み込まれます。

1. コードを GitHub にプッシュしておく（済み）。
2. [https://render.com](https://render.com) にサインアップ／ログイン。
3. **New +** → **Blueprint** を選択し、この GitHub リポジトリ（`kakeibo-app`）を選ぶ。
4. `render.yaml` が検出され、Web サービスが作成される。
5. **Environment（環境変数）** で以下を設定:
   - `ANTHROPIC_API_KEY` … Claude API キー（必須）
   - `APP_PASSWORD` … 任意のパスワード（公開時は必ず設定）
6. **Apply / Deploy** を実行。ビルド（`npm install && npm run build`）→ 起動（`npm start`）が走る。
7. 発行された URL（例: `https://kakeibo-app-xxxx.onrender.com`）にアクセス。
   ブラウザにユーザー名／パスワードを求められるので、パスワードに `APP_PASSWORD` の値を入力する
   （ユーザー名は任意）。

### 手動で設定する場合（render.yaml を使わないとき）
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: 上記の環境変数を設定

---

## 他のホスティングサービスの場合

Railway / Fly.io / VPS などでも同じ考え方で動きます。共通の要件は次のとおり:

| 項目 | 値 |
| --- | --- |
| ビルド | `npm install && npm run build`（バックエンド依存＋フロントのビルド） |
| 起動 | `npm start`（= `node server.js`） |
| 待受ポート | 環境変数 `PORT`（サービスが自動設定。コードは `process.env.PORT` を使用） |
| 必須の環境変数 | `ANTHROPIC_API_KEY` |
| 推奨の環境変数 | `APP_PASSWORD`（アクセス制限） |

`.env` ファイルは **リポジトリに含めない**（`.gitignore` 済み）。
本番の秘密情報は各サービスの環境変数設定で登録すること。

---

## ローカルで本番構成を確認する

```bash
npm run build                       # フロントをビルド
APP_PASSWORD=test npm start         # Express が3001でフロント＋APIを配信
# ブラウザで http://localhost:3001 を開く（パスワード: test）
```
