# Publish Gate — 統一分析スキーマ v1.0.0

## 概要

`src/shared/` は dashboard / proxy / extension の3コンポーネントが共有する分析出力の **single source of truth** です。

### ファイル構成

| ファイル | 役割 |
|---------|------|
| `schema.ts` | Zod スキーマ + TypeScript 型定義 |
| `normalize.ts` | raw AI出力 → normalized AnalysisResult 変換 |
| `version.ts` | `SCHEMA_VERSION` 定数 |
| `index.ts` | barrel export |

## raw output vs normalized output

```
Claude API → raw JSON (unvalidated) → normalizeAnalysisResult() → AnalysisResult (validated)
```

- **raw output**: Claude API が返す JSON。フィールド欠損、型の揺れ、余分なフィールドが含まれうる
- **normalized output**: Zod スキーマで検証済み。デフォルト値適用済み。UI / 保存 / API レスポンスはすべてこちらを使う

## スキーマ構造

4ステップ分析パイプラインに対応:

```
AnalysisResult
├── company_understanding   ← Step 1: 企業を知る
│   ├── summary
│   ├── industry
│   ├── business_model
│   ├── brand_tone { sentence_endings, uses_questions, tone_keywords, example_phrases }
│   ├── key_vocabulary[]
│   ├── credentials[]
│   └── site_cta_structure
├── page_reading            ← Step 2: ページを見る
│   ├── page_type
│   ├── fv_main_copy
│   ├── fv_sub_copy
│   ├── cta_map[] { text, href, position, prominence }
│   ├── trust_elements
│   ├── content_structure
│   ├── confidence (high|medium|low)
│   ├── screenshot_insights
│   └── dom_insights
├── improvement_potential   ← "+XX%"
├── issues[]                ← Step 3-4: 診断 + 依頼パック
│   ├── priority
│   ├── title
│   ├── diagnosis
│   ├── impact (high|medium|low)
│   ├── handoff_to (designer|engineer|copywriter+designer|marketer)
│   ├── brief { objective, direction, specifics, constraints[], qa_checklist[] }
│   └── evidence
├── regulatory?             ← Compliance flags
│   ├── yakujiho_risks[] { expression, risk_level, reason, recommendation }
│   └── keihinhyoujiho_risks[]
└── metadata                ← Analysis metadata
    ├── schema_version
    ├── analyzed_at
    ├── analysis_duration_ms
    ├── model_used
    ├── vision_used
    ├── dom_extracted
    └── source (dashboard|proxy|extension)
```

## 各コンポーネントでの使い方

### Dashboard (TypeScript)

```typescript
import { normalizeAnalysisResult } from '../../shared/normalize';
import type { AnalysisResult } from '../../shared/schema';

const raw = JSON.parse(claudeResponse);
const result: AnalysisResult = normalizeAnalysisResult(raw, {
  source: 'dashboard',
  model_used: 'claude-sonnet-4-6',
  vision_used: true,
});
```

### Proxy (JavaScript / Cloudflare Workers)

プロキシは独自のプロンプト構造 (goal_card / proposals / judgment) を使用。
`normalizeProxyResult()` で共通スキーマに変換。

```javascript
const normalized = normalizeProxyResult(rawResult, url);
// normalized は AnalysisResult 互換
```

### Extension (JavaScript)

`schema_version` を確認し、互換性チェック:

```javascript
const schemaVersion = result.metadata?.schema_version;
if (schemaVersion !== EXPECTED_SCHEMA_VERSION) {
  console.warn('Schema version mismatch');
}
```

## バージョニング規則

- `SCHEMA_VERSION` は semver に従う
- MINOR: 新しいオプショナルフィールド追加 (後方互換)
- MAJOR: 破壊的変更 (フィールド削除、型変更)
- バージョン変更時は `version.ts` を更新し、extension の `EXPECTED_SCHEMA_VERSION` も合わせる

## 拡張時の手順

1. `schema.ts` に Zod スキーマを追加
2. 型は `z.infer<typeof XxxSchema>` で自動導出
3. `normalize.ts` の変換ロジックを更新
4. テスト追加 (`src/shared/__tests__/schema.test.ts`)
5. `SCHEMA_VERSION` の MINOR をインクリメント
