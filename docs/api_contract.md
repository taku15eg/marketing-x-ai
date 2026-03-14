# API契約 — Publish Gate

**更新日**: 2026-03-14
**状態**: Phase 0 棚卸し。Phase 1 で統一・テスト追加予定。

---

## 現行API一覧

### Dashboard API (正本)

**Base**: Next.js App Router (`src/dashboard/app/api/`)

#### POST /api/analyze

分析パイプライン実行。

```
Request:
  Content-Type: application/json
  Body: { "url": string, "ref"?: "share" }
  Max body size: 10KB

Response (200):
  {
    "id": string (nanoid 21),
    "url": string,
    "status": "completed" | "error",
    "result"?: AnalysisResult,  // status=completed時
    "error"?: string,           // status=error時
    "created_at": string (ISO8601)
  }
  Headers:
    X-Cache: "HIT" | "MISS"
    X-RateLimit-Remaining: string
    X-RateLimit-Reset: string (ISO8601)

Error responses:
  400: URL未指定 / 不正JSON / SSRF検出
  413: リクエストボディ超過
  429: レート制限 (per-minute or monthly)
  500: 内部エラー
```

#### GET /api/analyze?id={analysisId}

保存済み分析結果の取得。

```
Response (200): AnalyzeResponse
Response (400): id未指定
Response (404): 存在しない / TTL超過
```

#### POST /api/share

共有リンク生成。

```
Request:
  Body: { "analysis_id": string }

Response (201):
  {
    "share_id": string (nanoid 21),
    "share_url": string
  }

Error responses:
  400: analysis_id未指定
  404: 分析結果が存在しない
  429: 共有レート制限 (30/min)
  500: 内部エラー
```

#### GET /api/share?id={shareId}

共有リンクから分析結果取得。

```
Response (200): AnalyzeResponse
Response (400): id未指定
Response (404): 存在しない / TTL超過
```

---

### Worker API (旧アーキテクチャ — 未使用)

**Base**: Cloudflare Workers (`src/proxy/worker.js`)

> ⚠️ Dashboard APIとスキーマが異なる。Phase 1で方針決定。

#### POST /api/v1/analyze

```
Request:
  Body: {
    "page_features": object (content scriptの抽出結果),
    "layer"?: 0|1|2|3,
    "judgment_history"?: array,
    "gsc_data"?: object,
    "ga4_data"?: object,
    "confirmed_goal"?: object
  }

Response:
  {
    "goal_card": { company_hypothesis, page_role, primary_cv, ... },
    "judgment": "PASS" | "FAIL" | "HOLD",
    "proposals": [{ priority, title, category, before, after, ... }]
  }
```

---

## 型定義 (正本: src/dashboard/lib/types.ts)

### AnalysisResult

```typescript
{
  company_understanding: {
    summary: string
    industry: string
    business_model: string
    brand_tone: BrandTone
    key_vocabulary: string[]
    credentials: string[]
    site_cta_structure: string
  }
  page_reading: {
    page_type: string
    fv_main_copy: string
    fv_sub_copy: string
    cta_map: CTAInfo[]
    trust_elements: string
    content_structure: string
    confidence: "high" | "medium" | "low"
    screenshot_insights: string
    dom_insights: string
  }
  improvement_potential: string  // "+XX%"
  issues: Issue[]
  regulatory?: RegulatoryCheck
  metadata: AnalysisMetadata
}
```

### Issue

```typescript
{
  priority: number
  title: string
  diagnosis: string
  impact: "high" | "medium" | "low"
  handoff_to: "designer" | "engineer" | "copywriter+designer" | "marketer"
  brief: {
    objective: string
    direction: string
    specifics: string
    constraints: string[]
    qa_checklist: string[]
  }
  evidence: string
}
```

---

## レート制限

| ルール | 上限 | ウィンドウ | キー |
|--------|------|----------|------|
| Per-minute | 10 req | 60秒 | `minute:{clientIP}` |
| Free monthly | 5 req | 30日 | `monthly:{clientIP}` |
| Share creation | 30 req | 60秒 | `share:{clientIP}` |

---

## CORS

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

Phase 1+: dashboard origin + chrome-extension://{extensionId} に制限予定

---

## ストレージTTL

| ストア | TTL | 備考 |
|--------|-----|------|
| Analysis | 24時間 | インメモリ。Supabase移行後は無期限 |
| Share | 7日 | インメモリ。Supabase移行後は無期限 |
| URL Cache | 1時間 | 同一URLの重複分析を防止 |

ストアサイズ上限: 1000エントリ (FIFO eviction)
