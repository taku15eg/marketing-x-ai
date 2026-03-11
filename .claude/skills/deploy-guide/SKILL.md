---
name: deploy-guide
description: >
  ローカル開発環境の構築・デプロイ手順を案内する。初心者にもわかる形で
  ステップバイステップで説明する。Use when: 環境構築, ローカル起動,
  デプロイ, 'npm run dev', 'セットアップ', 'setup', '起動', 'deploy'。
---

# Deploy Guide — 環境構築＆デプロイ

## ローカル開発環境の起動

### 前提条件
- Node.js 18以上（推奨: 22.x）
- npm 10以上

### 手順

```bash
# 1. リポジトリをクローン（まだの場合）
git clone <repository-url>
cd marketing-x-ai

# 2. ダッシュボードディレクトリへ移動
cd src/dashboard

# 3. 環境変数を設定
cp .env.example .env.local
# .env.local を編集して ANTHROPIC_API_KEY を設定

# 4. パッケージインストール
npm install

# 5. 開発サーバー起動
npm run dev
# → http://localhost:3000 で開く
```

### 環境変数

| 変数 | 必須 | 説明 |
|------|------|------|
| `ANTHROPIC_API_KEY` | 必須 | Claude APIキー（sk-ant-...） |
| `SCREENSHOT_API_KEY` | 任意 | スクリーンショットAPI |
| `NEXT_PUBLIC_SUPABASE_URL` | 将来 | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 将来 | Supabase匿名キー |

### よくあるトラブル

| 症状 | 対処 |
|------|------|
| `command not found: npm` | https://nodejs.org からNode.js LTSをインストール |
| `port 3000 already in use` | `npx kill-port 3000` で解放 |
| 分析がエラーになる | `.env.local` のAPIキーを確認 |
| ビルドが通らない | `npm install` を再実行してから `npm run build` |

## 技術スタック

| 領域 | 技術 |
|------|------|
| Web | Next.js 15 + React 19 + Tailwind CSS 4 |
| 言語 | TypeScript 5.7 |
| テスト | Vitest + Playwright |
| AI | Claude API (claude-sonnet-4-6) |
| DB | In-memory（MVP） → Supabase（Phase 1+） |

## Chrome拡張の開発

```bash
# Chrome で chrome://extensions を開く
# 「デベロッパーモード」をON
# 「パッケージ化されていない拡張機能を読み込む」
# → src/extension/ フォルダを選択
```
