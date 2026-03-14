# β イベント計測設計書

**版：v1.0　更新日：2026-03-14**

---

## 目的

Phase 0.5 βの GO/NO-GO 判定に必要な定量データを収集する。
センターピン：「藤野型が分析結果URLをクライアントに送ったか」を数値で確認する。

---

## 命名規則

- 形式: `{object}_{verb}` (snake_case)
- object: `analysis`, `share`, `tab`, `brief`, `extension`
- verb: `started`, `completed`, `failed`, `created`, `opened`, `viewed`

---

## イベント一覧

### サーバーサイドイベント（自動記録）

| イベント名 | 発火条件 | 発火元 | 属性 | 仮説 |
|---|---|---|---|---|
| `analysis_started` | POST /api/analyze 受信時 | API route | `url`, `referral_source` (direct/share), `source` (web/chrome-extension) | H1 |
| `analysis_completed` | 分析パイプライン成功時 | API route | `url`, `referral_source`, `source` | H1 |
| `analysis_failed` | 分析パイプライン失敗時 | API route | `url`, `error`, `source` | H1 |
| `analysis_cache_hit` | URL キャッシュヒット時 | API route | `url` | コスト最適化 |
| `share_created` | POST /api/share 成功時 | API route | `analysis_id`, `share_id` | H2 |
| `share_opened` | GET /api/share?id= 成功時 | API route | `share_id` | H3 |
| `shared_visitor_reanalyzed` | ref=share で分析開始時 | API route | `url` | H3 |

### クライアントサイドイベント（/api/track 経由）

| イベント名 | 発火条件 | 発火元 | 属性 | 仮説 |
|---|---|---|---|---|
| `tab_viewed` | 分析結果ページ表示時 | analysis/[id], share/[id] | `tab`, `analysis_id` or `share_id`, `context` | H1 |
| `brief_viewed` | IssueCard 展開（初回のみ） | IssueCard コンポーネント | `issue_priority`, `issue_title` | H1 |
| `extension_analysis_started` | 拡張から分析開始時 | service-worker.js | `url` | 拡張→本体 |
| `extension_sent_to_dashboard` | 「Webダッシュボードで見る」クリック | sidepanel/app.js | `analysis_id`, `url` | 拡張→本体 |

---

## 重複送信防止

| 方式 | 対象 | 実装 |
|---|---|---|
| サーバーサイド | 構造的に1リクエスト=1イベントのため自然に防止 | API route 内で1回だけ logEvent |
| クライアントサイド | tab_viewed など | sessionStorage の dedupKey で制御 |
| brief_viewed | IssueCard | React ref で初回展開のみ |

---

## 保存方式

### Phase 0.5（現在）
- **インメモリ ring buffer**（最大5000件）
- サーバー再起動でリセット
- `getBetaMetrics()` で集計取得可能
- βは3-5名・4週間なので十分

### Phase 1（予定）
- Supabase の `events` テーブルに INSERT
- event-logger.ts の `logEvent` 内部を差し替えるだけ

---

## アーキテクチャ

```
[Browser]                    [Server]
  │                            │
  ├── /api/analyze POST ──────►├── logEvent('analysis_started')
  │                            ├── logEvent('analysis_completed' or 'analysis_failed')
  │                            │
  ├── /api/share POST ────────►├── logEvent('share_created')
  ├── /api/share GET ─────────►├── logEvent('share_opened')
  │                            │
  ├── /api/track POST ────────►├── logEvent(client events)
  │   (tab_viewed, brief_viewed)
  │
[Chrome Extension]
  ├── service-worker.js ──────►├── /api/track ('extension_analysis_started')
  ├── sidepanel/app.js ───────►├── /api/track ('extension_sent_to_dashboard')
```

---

## β判断で見る指標

### H1：「おっ」の確認
- `analysis_completed / analysis_started` = 分析完了率（目標 > 85%）
- `tab_viewed` count = タブ1閲覧率（目標 > 70%）
- `brief_viewed` count = 依頼書まで見たか

### H2：「送る」の確認
- `share_created` count per user = 共有URL生成数（目標：5名中3名が1回以上）
- `share_created / analysis_completed` = 共有率

### H3：「新規が来る」の確認
- `share_opened` count = 共有URL閲覧数
- `shared_visitor_reanalyzed` count = 共有経由の新規分析（目標：1件以上）
- `shared_visitor_reanalyzed / share_opened` = バイラル転換率

### 拡張→本体の送客
- `extension_analysis_started` count = 拡張からの分析数
- `extension_sent_to_dashboard` count = ダッシュボードへの送客数

---

## API エンドポイント

### POST /api/track

クライアントサイドイベントの受信用。

**Request:**
```json
{
  "type": "tab_viewed",
  "data": {
    "tab": "lp_analysis",
    "analysis_id": "abc123"
  }
}
```

**Response:**
```json
{ "ok": true }
```

**制限:**
- 許可されたイベントタイプのみ受付（ホワイトリスト方式）
- 許可リスト: `tab_viewed`, `brief_viewed`, `shared_visitor_reanalyzed`, `extension_analysis_started`, `extension_sent_to_dashboard`

---

## テスト

| テストファイル | 内容 |
|---|---|
| `__tests__/event-logger.test.ts` | 全イベントタイプの記録・集計・ファネル・リファラル統計 |
| `__tests__/tracker.test.ts` | クライアントサイド tracker の送信・dedup・エラーハンドリング |
