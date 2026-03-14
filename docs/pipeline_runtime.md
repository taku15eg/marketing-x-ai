# 分析パイプラインランタイム — Publish Gate

**更新日**: 2026-03-14

---

## パイプライン概要

```
POST /api/analyze { url }
       ↓
  ┌─────────────────┐
  │  1. 企業リサーチ │  researchCompany(url)
  │  HTML fetch +    │  → CompanyResearchResult
  │  メタ抽出        │  所要: ~2-5秒
  └────────┬────────┘
           ↓
  ┌─────────────────┐
  │  2. ページ読取    │  readPage(url)
  │  DOM抽出 +       │  → DOMData + screenshot_base64
  │  Screenshot     │  所要: ~3-8秒
  └────────┬────────┘
           ↓
  ┌─────────────────┐
  │  3-4. 診断+提案   │  analyzeWithClaude(company, dom, screenshot, url)
  │  Claude API     │  → AnalysisResult
  │  1回の呼出し     │  所要: ~10-30秒
  └────────┬────────┘
           ↓
  AnalyzeResponse { id, url, status, result }
```

**合計所要時間**: 約15-45秒（Claude API応答時間に依存）

---

## 各ステップの責務

### Step 1: 企業リサーチ (`lib/company-research.ts`)

- 入力: URL
- 処理: 対象ページ + ルートページの HTML を fetch
- 出力: `CompanyResearchResult` (概要, ブランドトーン, 語彙, 実績)
- エラー時: 空の結果を返す（分析は継続）

### Step 2: ページ読取 (`lib/page-reader.ts`)

- 入力: URL
- 処理: HTML fetch → DOM抽出（メタ, 見出し, CTA, 画像, テキスト） + Screenshot API
- 出力: `DOMData` + `screenshot_base64` (null可)
- エラー時: SSRFErrorは上位に伝播。その他のエラーは screenshotがnullになるだけ

### Step 3-4: 診断+提案 (`lib/prompt-builder.ts`)

- 入力: CompanyResearchResult + DOMData + screenshot + URL
- 処理: Claude API (claude-sonnet-4-6) 呼出し
- 出力: `AnalysisResult`
- エラー時: **JSON逸脱 → fallback結果を返す（UIは壊れない）**

---

## エラーハンドリング戦略

### 致命的エラー（分析中止）
- ANTHROPIC_API_KEY 未設定
- SSRF 検出（プライベートIP, localhost等）
- Claude API HTTP エラー（4xx, 5xx）

### 復旧可能エラー（分析継続）
- Screenshot API 失敗 → null（DOM分析のみ）
- ルートページ fetch 失敗 → 空文字列
- Claude JSON逸脱 → fallback結果

### fallback結果の構造

JSON パースに失敗した場合、`createFallbackResult()` が以下を返す:
- `confidence: 'low'`
- 空の `company_understanding` と `page_reading`
- 1件の issue: 「AI分析レスポンスの解析に失敗しました」
- `impact: 'high'`, `handoff_to: 'engineer'`

---

## 「コピーを書かない」原則の実装

### プロンプト層
- システムプロンプト: 「コピー文言は出さず構造変化を提案」
- JSON出力のみ指示: 「JSON出力のみ。他テキスト禁止」

### 型層
- `Issue.brief.direction`: 構造変化の方向性（コピー文言ではない）
- `Issue.brief.specifics`: 具体的な構造変更内容
- `handoff_to`: 'copywriter+designer'（合同のみ、copywriter単独不可）

### 検証
- `__tests__/pipeline.test.ts` でプロンプト内のガード文言を確認
- 実行時のpostprocess検証は未実装（TODO: Phase 4+で検討）

---

## パフォーマンス特性

| ステップ | 並列化 | キャッシュ |
|---------|--------|----------|
| Step 1 | 対象ページ + ルートページ = `Promise.allSettled` | URLキャッシュ 1h |
| Step 2 | DOM抽出は同期。Screenshot API は非同期 | 同上 |
| Step 3-4 | 単一Claude API呼出し（診断+提案を1回で） | 同上 |

**URLキャッシュ**: 同じURLの分析は1時間以内は再実行しない。レート制限カウントも消費しない。

---

## モニタリング

| メトリクス | イベント名 | 備考 |
|----------|----------|------|
| 分析開始 | `analysis_started` | url, referral_source |
| 分析完了 | `analysis_completed` | url, referral_source |
| 分析エラー | `analysis_error` | url, error |
| キャッシュヒット | `analysis_cache_hit` | url |
