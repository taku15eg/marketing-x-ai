---
name: deploy
description: >
  デプロイを実行する。Dashboard（Vercel）とProxy（Cloudflare Workers）。
  $ARGUMENTSで対象を指定可能。docs/DEPLOY-GUIDE.md に基づく。
  Use when: デプロイ、リリース、本番反映。
---

# Deploy

## 引数

- `proxy`: Cloudflare Workers Proxyのみ
- `dashboard`: Dashboard（Vercel）のみ
- `all`: 全コンポーネント

## 前提条件チェック

1. テストが全PASS: `cd src/dashboard && npm run test`
2. ビルドが成功: `cd src/dashboard && npm run build`
3. セキュリティテストがPASS: `cd src/dashboard && npx vitest run __tests__/security.test.ts`

## 手順

### Proxy (Cloudflare Workers)
```bash
cd src/proxy
npx wrangler deploy
```

### Dashboard (Vercel)
- Vercel CLIまたはGit pushによる自動デプロイ
- 環境変数の確認（Vercelダッシュボードで設定済みか）

### Chrome拡張
- Chrome Web Store Developer Dashboardで手動アップロード
- パッケージ: `src/extension/` ディレクトリをzip

## デプロイ後確認
- ヘルスチェック
- 主要フローの動作確認（URL入力→分析→結果表示）
- エラー監視の確認

詳細手順: `docs/DEPLOY-GUIDE.md`
