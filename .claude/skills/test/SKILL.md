---
name: test
description: >
  テストを実行し結果を報告する。Vitest単体テスト + Playwright E2Eテスト。
  $ARGUMENTSで対象を指定可能（例: /test security, /test e2e, /test all）。
  Use when: テスト実行、テスト結果確認、CI前チェック。
---

# Test Runner

## 引数

- `(なし)` or `unit`: Vitest単体テストのみ
- `e2e`: Playwright E2Eテストのみ
- `security`: セキュリティテスト（security.test.ts）のみ
- `all`: 全テスト実行

## 手順

1. 引数に応じてテストを実行:

```bash
cd src/dashboard

# unit (default)
npm run test

# e2e
npm run test:e2e

# security only
npx vitest run __tests__/security.test.ts

# all
npm run test && npm run test:e2e
```

2. テスト結果を解析:
   - 失敗テストの原因を特定
   - 修正案を提示
   - 修正後に再実行して合格を確認

3. TEST-SCENARIOS.json の10シナリオについて:
   - 7基準 × 配点で自己採点
   - 80点未満はプロンプト修正→再テスト（最大3回）

## 合格基準
- 単体テスト: 全PASS
- セキュリティテスト: 全PASS（CRITICAL/HIGH）
- E2E正常系: 完走
- E2E異常系: 全ケースで適切なエラー
