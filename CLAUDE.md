# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

kakeibo-app は家計簿アプリです（Claude Code 研修用プロジェクト）。
本ディレクトリはまだ空のグリーンフィールド状態で、技術スタックは未定です。
実装を始める際は、選定したスタックに合わせて本ファイルの「開発コマンド」節を更新してください。

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

技術スタック確定後に、ビルド・Lint・テスト（単体テストの個別実行方法を含む）・開発サーバー起動などのコマンドをここに追記する。

## コード構成

実装が進んだら、複数ファイルを横断して理解が必要な「全体像」（アーキテクチャ・データフロー・主要モジュールの役割）をここに記述する。

## 言語

やり取り・コミットメッセージ・コメントは日本語で行う。
