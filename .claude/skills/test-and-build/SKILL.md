---
name: test-and-build
description: >
  テスト実行・ビルド検証・品質チェックを行う。Use when: テスト実行,
  ビルド確認, コード変更後の検証, 'test', 'build', 'テスト', 'ビルド',
  CI/CD, lint, 品質チェック。
---

# Test & Build — テスト実行＆ビルド検証

## コマンド一覧

```bash
cd src/dashboard

# ユニットテスト（Vitest）— 174テスト
npm run test

# 特定のテストファイルだけ実行
npx vitest run __tests__/security.test.ts

# E2Eテスト（Playwright）
npx playwright test

# ビルド
npm run build

# lint
npm run lint
```

## テストファイル構成

### ユニットテスト（`src/dashboard/__tests__/`）

| ファイル | 対象 | テスト数 |
|---------|------|---------|
| `security.test.ts` | SSRF防御・ID推測防止 | 40+ |
| `analyzer.test.ts` | パイプライン全体 | — |
| `api-integration.test.ts` | APIルート | — |
| `company-research.test.ts` | 企業リサーチ | — |
| `page-reader.test.ts` | DOM抽出 | — |
| `prompt-builder.test.ts` | Claude API連携 | — |
| `rate-limiter.test.ts` | レート制限 | — |
| `event-logger.test.ts` | イベント記録 | — |
| `url-cache.test.ts` | キャッシュ | — |

### E2Eテスト（`src/dashboard/e2e/`）

| ファイル | 対象 |
|---------|------|
| `homepage.spec.ts` | URL入力・エラー表示 |
| `analysis-flow.spec.ts` | 分析フロー全体 |
| `api.spec.ts` | APIエンドポイント |
| `share.spec.ts` | 共有URL・公開ページ |

## 変更後の検証フロー

1. `npm run test` — 全ユニットテスト通過を確認
2. `npm run build` — ビルドエラーなしを確認
3. セキュリティ変更時は `npx vitest run __tests__/security.test.ts` を重点確認

## トラブルシューティング

| 症状 | 対処 |
|------|------|
| テストがタイムアウト | `vitest.config.ts` のtimeout設定を確認 |
| モジュール解決エラー | `npm install` を再実行 |
| ビルドの型エラー | `types.ts` の整合性を確認 |
| E2Eが落ちる | `npx playwright install` でブラウザをインストール |
