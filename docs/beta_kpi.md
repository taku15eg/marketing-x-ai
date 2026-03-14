# β検証KPI設計 — Publish Gate

**更新日**: 2026-03-14

---

## North Star Metric

**β5名中3名が共有URL生成1回以上**

---

## KPIツリー

```
North Star: β5名中3名が共有URL生成1回以上
  │
  ├── H1: 分析完了率
  │   event: analysis_completed / analysis_started
  │   目標: > 80%
  │
  ├── H2: 共有URL生成率
  │   event: share_url_generated / analysis_completed
  │   目標: > 60%（5名中3名）
  │
  └── H3: バイラル係数 K
      event: share_cta_clicked → analysis_completed (ref=share)
      目標: K > 0.1（初期）
```

---

## イベント一覧

| イベント名 | トリガー | データ | 計測対象 |
|-----------|---------|--------|---------|
| `analysis_started` | POST /api/analyze 受信 | url, referral_source | H1分母 |
| `analysis_completed` | 分析パイプライン成功 | url, referral_source | H1分子, H2分母 |
| `analysis_error` | 分析パイプライン失敗 | url, error | エラー率 |
| `analysis_cache_hit` | URLキャッシュヒット | url | キャッシュ効率 |
| `share_url_generated` | POST /api/share 成功 | analysis_id, share_id | H2分子 |
| `share_page_viewed` | GET /api/share?id= 成功 | share_id | バイラルファネル |
| `share_cta_clicked` | 共有ページCTAクリック | share_id | H3ファネル入口 |

---

## メトリクスエンドポイント

`GET /api/metrics` — 内部用メトリクスAPI

```json
{
  "events": {
    "analysis_started": 0,
    "analysis_completed": 0,
    "analysis_error": 0,
    "analysis_cache_hit": 0,
    "share_url_generated": 0,
    "share_page_viewed": 0,
    "share_cta_clicked": 0
  },
  "referral": {
    "total_shares": 0,
    "analyses_from_referral": 0,
    "conversion_rate": 0.0
  },
  "kpi": {
    "total_analyses": 0,
    "total_shares": 0,
    "viral_coefficient": 0.0,
    "cache_hit_rate": 0.0,
    "error_rate": 0.0
  }
}
```

---

## バイラルファネル

```
share_url_generated (ユーザーが共有URLを生成)
    ↓
share_page_viewed (受信者が共有ページを閲覧)
    ↓
share_cta_clicked (受信者がCTAをクリック)
    ↓
analysis_started (ref=share) (受信者が自分のURL分析開始)
    ↓
analysis_completed (ref=share) (受信者の分析完了 = K係数の分子)
```

---

## 制限事項（MVP）

- イベントストアはインメモリ（サーバー再起動でリセット）
- ユーザー単位の識別なし（IP単位のみ）
- リアルタイムダッシュボードなし（/api/metrics でJSON取得のみ）
- Phase 1以降: Supabaseに永続化、ユーザー認証後のユーザー単位追跡
