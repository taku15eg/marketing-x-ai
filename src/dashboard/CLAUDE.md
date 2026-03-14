# Dashboard (Next.js 15 + Tailwind CSS 4)

## コマンド
```bash
npm run dev          # 開発サーバー (port 3000)
npm run build        # 本番ビルド
npm run lint         # ESLint
npm run test         # Vitest 単体テスト
npm run test:e2e     # Playwright E2E
```

## ディレクトリ構成
- `app/` — Next.js App Router ページ
- `components/` — UIコンポーネント
- `lib/` — ビジネスロジック（分析エンジン、バリデーション等）
- `__tests__/` — Vitest単体テスト
- `e2e/` — Playwright E2Eテスト

## 制約
- `dangerouslySetInnerHTML` 使用禁止
- `NEXT_PUBLIC_` 以外の環境変数はサーバーサイドAPI routes内のみで使用
- ユーザー入力URLは必ず `lib/url-validator.ts` でSSRFチェック
- 分析結果の共有URL IDは `nanoid(21)` 以上（連番禁止）

## テスト
- 単体: `__tests__/*.test.ts` — vitest
- E2E: `e2e/*.spec.ts` — playwright
- テストシナリオ: `../../TEST-SCENARIOS.json`
- セキュリティテスト（security.test.ts）は全PASS必須

## 環境変数
`.env.example` を参照。`.env.local` にコピーして値を設定。
