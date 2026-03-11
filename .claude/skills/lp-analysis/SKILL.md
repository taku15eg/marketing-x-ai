---
name: lp-analysis
description: >
  Publish Gateの4ステップLP分析パイプラインの実装・改善・デバッグを行う。
  Use when: LP分析機能の修正, analyzer.tsの変更, company-research/page-reader/
  prompt-builderの改修, 分析結果JSONの構造変更, Vision API連携の問題。
---

# LP Analysis Pipeline — 4ステップ分析エンジン

## パイプライン構造

```
① 企業を知る (company-research.ts)
   → ドメインの企業情報を自動fetch。トーン・語彙・実績を抽出
   → 出力: CompanyResearchResult

② ページを見る (page-reader.ts)
   → Vision API（FVスクショ）+ DOM + CTA分類 + 空間配置
   → DOMデータのサニタイズ: scriptタグ/onXXXイベント属性は除去
   → 出力: DOMData + screenshot_base64

③ 診断する (prompt-builder.ts)
   → 課題をインパクト順に構造化。薬機法チェック
   → ページコンテンツは <page_content> XMLタグで囲む
   → 出力: issues[], regulatory{}

④ 依頼パックを出す (prompt-builder.ts)
   → デザイナー/エンジニア向けブリーフ
   → コピー文言は出さず構造変化を図示
   → 出力: brief { objective, direction, specifics, constraints, qa_checklist }
```

## キーファイルマップ

| ファイル | 役割 |
|---------|------|
| `src/dashboard/lib/analyzer.ts` | パイプラインオーケストレーター |
| `src/dashboard/lib/company-research.ts` | Step 1: 企業リサーチ |
| `src/dashboard/lib/page-reader.ts` | Step 2: DOM抽出 + スクリーンショット |
| `src/dashboard/lib/prompt-builder.ts` | Step 3-4: Claude API呼び出し + JSON解析 |
| `src/dashboard/lib/types.ts` | 全型定義 |
| `src/dashboard/app/api/analyze/route.ts` | APIエンドポイント |

## 出力JSON構造

```json
{
  "company_understanding": {
    "summary": "...", "industry": "...", "business_model": "...",
    "brand_tone": "...", "key_vocabulary": [], "credentials": [],
    "site_cta_structure": "..."
  },
  "page_reading": {
    "page_type": "...", "fv_main_copy": "...", "fv_sub_copy": "...",
    "cta_map": [], "trust_elements": "...",
    "content_structure": "...", "confidence": "..."
  },
  "improvement_potential": "+XX%",
  "issues": [{
    "priority": 1, "title": "...", "diagnosis": "...",
    "impact": "...", "handoff_to": "designer|engineer|copywriter+designer",
    "brief": {
      "objective": "...", "direction": "...", "specifics": "...",
      "constraints": [], "qa_checklist": []
    },
    "evidence": "..."
  }],
  "regulatory": {
    "yakujiho_risks": [], "keihinhyoujiho_risks": []
  }
}
```

## 変更時のルール

1. **Vision APIは省略しない** — スクリーンショット分析は必須機能
2. **URL入力だけで全部出る** — 追加入力を要求してはならない
3. **コピー文言は出さない** — 構造変化を図示する
4. **テキスト長制限**: 1ページあたり最大50,000文字
5. **変更後は必ずテスト実行**: `npm run test` in `src/dashboard/`

## 関連テスト

| テストファイル | カバー範囲 |
|-------------|-----------|
| `__tests__/analyzer.test.ts` | パイプライン全体 |
| `__tests__/company-research.test.ts` | 企業リサーチ |
| `__tests__/page-reader.test.ts` | DOM抽出 |
| `__tests__/prompt-builder.test.ts` | Claude API連携 |
| `__tests__/api-integration.test.ts` | APIルート |

## トラブルシューティング

| 症状 | 原因と対処 |
|------|-----------|
| 分析が途中で止まる | `analyzer.ts` の AbortController タイムアウト確認 |
| JSON解析エラー | `prompt-builder.ts` のレスポンスパース処理を確認 |
| スクリーンショットが取れない | `SCREENSHOT_API_KEY` 環境変数の設定確認 |
| 薬機法チェックが出ない | `regulatory` フィールドのプロンプト指示を確認 |
