# Publish Gate

URLを入れるだけで、LP改善だけでなくマーケティング全体が見えるSaaS。
現在 **Phase 0.5** — Webダッシュボード（タブ1: LP分析）+ 共有URL + Chrome拡張Side Panel。

## クイックスタート（3ステップ）

```bash
# 1. 依存インストール
npm run setup

# 2. 環境変数を設定
cp .env.example src/dashboard/.env.local
# → .env.local に ANTHROPIC_API_KEY を記入

# 3. 開発サーバー起動
npm run dev
# → http://localhost:3000
```

## プロジェクト構造

```
publish-gate/
├── src/
│   ├── dashboard/       ← Web本体（Next.js）★日常の開発対象
│   ├── extension/       ← Chrome拡張（Manifest V3 / Side Panel）
│   └── proxy/           ← Cloudflare Worker（APIプロキシ）
├── docs/                ← 設計ドキュメント一式
├── demo/                ← デモHTML（v3〜v7）
├── context/             ← インタビュー原文
├── reference/           ← 旧バージョンREADME
├── CLAUDE.md            ← プロジェクトコンテキスト（最重要）
├── package.json         ← ルートスクリプト（dashboardへの委譲）
└── .env.example         ← 環境変数テンプレート
```

**開発の重心は `src/dashboard/`。** ルートの `npm run dev` で直接起動できる。

## スクリプト一覧

| コマンド | 内容 |
|---------|------|
| `npm run dev` | ダッシュボード開発サーバー (port 3000) |
| `npm run build` | プロダクションビルド |
| `npm run start` | プロダクションサーバー起動 |
| `npm run lint` | ESLint実行 |
| `npm run test` | Vitest ユニットテスト |
| `npm run test:watch` | テストのウォッチモード |
| `npm run test:e2e` | Playwright E2Eテスト |
| `npm run setup` | dashboard の `npm install` |
| `npm run dev:proxy` | Cloudflare Worker ローカル起動 |
| `npm run deploy:proxy` | Cloudflare Worker デプロイ |

## 環境変数

`.env.example` を `src/dashboard/.env.local` にコピーして使用。

| 変数 | 必須 | 説明 |
|------|------|------|
| `ANTHROPIC_API_KEY` | Yes | Claude API キー（サーバーサイド専用） |
| `SCREENSHOT_API_KEY` | No | スクリーンショットAPI（Vision分析用） |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase URL（Phase 1+） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase Anon Key（Phase 1+） |

## 技術スタック

| 領域 | 技術 |
|------|------|
| Web | Next.js 15 + Tailwind CSS 4 + React 19 |
| Chrome拡張 | Manifest V3 + Side Panel API |
| バックエンド | Cloudflare Workers |
| DB | Supabase（PostgreSQL + Auth + RLS） |
| AI | Claude API + Vision API |
| テスト | Vitest + Playwright |

## Phase 0.5 スコープ

**作る:** Webダッシュボード（タブ1: LP分析）+ 共有URL + Chrome拡張Side Panel
**作らない:** タブ2-6 / アカウント機能 / メール通知 / CSV / 決済

## ドキュメント

- [`CLAUDE.md`](./CLAUDE.md) — プロジェクトコンテキスト（設計原則・セキュリティ要件）
- [`docs/`](./docs/) — 設計ドキュメント一式
- [`DEPLOY-GUIDE.md`](./DEPLOY-GUIDE.md) — デプロイ手順
- [`CROSS-PLATFORM-GUIDE.md`](./CROSS-PLATFORM-GUIDE.md) — クロスプラットフォーム対応

## 開発元

- **Hashigaya Takuya**
- プロジェクト開始: 2026-02-27
