# Publish Gate 品質・計測・運用設計書

**版：v3.0　更新日：2026-03-08**

---

## v3.0 変更サマリー

- Webダッシュボードが本体（Chrome拡張はリテンション/リマーケ）に適合
- 6タブ構造の計測設計
- バイラル係数K（共有URL生成数 x 共有URL経由新規率）がNorth Star
- Phase別KPI体系の導入
- フライホイール健全性指標の新設
- Vision API + 薬機法チェックの品質基準追加
- セキュリティ品質（プロンプト漏洩0件）の明文化

---

## 1. 品質レイヤー（L0〜L4）

Webダッシュボード（本体）とChrome拡張（リテンション/リマーケ）の両面で品質を担保する。

| レイヤー | 定義 | 対象 | MVP必須 |
|---|---|---|---|
| **L0 安全** | 事故を起こさない（機密保護・安定稼働・プロンプト漏洩防止） | 全体 | 必須 |
| **L1 信頼** | 根拠ある出力（確からしさ・一貫性・薬機法/景表法遵守） | AI出力 | 必須 |
| **L2 実用** | 実装に落ちる（依頼書の具体性・再現性・確認可能性） | 依頼パック | 必須 |
| **L3 共有** | 共有URLで価値が伝わる（OGP・閲覧体験・導線） | 共有URL | 必須 |
| **L4 学習** | 学びが積み上がる（パターンDB蓄積・再利用・負債化しない） | パイプライン | 最小 |

---

## 2. レイヤー別テスト・NGライン

### L0：安全

| テスト | NGライン | 優先度 |
|---|---|---|
| プロンプト漏洩（出力にプロンプト断片が含まれる） | 0件 | P0 |
| APIキー非露出（クライアント側にキーが露出） | 0件 | P0 |
| 個人情報マスキング（メール・電話番号） | マスキング漏れ = 0件 | P0 |
| プロンプトインジェクション防御（URL入力経由） | 突破 = 0件 | P0 |
| 出力正規化（JSON構造外のテキスト混入） | 漏出 = 0件 | P0 |
| Vision APIスクリーンショット保存期間 | 分析完了後24時間以内に削除 | P0 |
| Webダッシュボード重大表示崩れ | 0件 | P0 |
| Chrome拡張Side Panel重大表示崩れ | 0件 | P1 |

### L1：信頼

| テスト | NGライン | 優先度 |
|---|---|---|
| 根拠なし提案（出典・データなしで断定） | 0件 | P0 |
| 薬機法/景表法チェック漏れ（健康食品・化粧品LP） | 0件 | P0 |
| Vision API分析とDOM分析の矛盾（同一要素で食い違い） | > 5% | P0 |
| 低確度で断定（確度「低」なのに断定表現） | > 1% | P0 |
| 企業リサーチ推定の明示的誤り | > 10% | P1 |

### L2：実用

| テスト | NGライン | 優先度 |
|---|---|---|
| 依頼書の必須項目欠落（課題・変更指示・計測設計） | > 2% | P0 |
| 依頼書の差戻し率（デザイナー/エンジニアが実行不能） | > 15% | P1 |
| CSV出力のフォーマットエラー | > 1% | P1 |

### L3：共有

| テスト | NGライン | 優先度 |
|---|---|---|
| 共有URLの表示崩れ（OGP未生成・レイアウト崩壊） | 0件 | P0 |
| 共有URL閲覧から「自分も分析」への導線欠如 | 0件 | P0 |
| 共有URL閲覧ページのLCP | > 3秒 | P1 |
| ロックタブのプラン誘導が機能しない | 0件 | P1 |

### L4：学習

| テスト | NGライン | 優先度 |
|---|---|---|
| 分析パターンDBの蓄積率（完了分析のうちDB登録される割合） | < 80% | P1 |
| パターン再利用による分析時間短縮効果 | < 10%改善 | P2 |

---

## 3. North Star & KPI

### North Star Metric：バイラル係数 K

```
K = 共有URL生成数（月） × 共有URL経由新規率
```

- **共有URL生成数**：分析完了後に共有URLを生成（コピー or SNSシェア）した回数
- **共有URL経由新規率**：共有URLを踏んだユニークユーザーのうち、自ら分析を開始した率

**目標**：K > 1.0（1人の利用者が1人以上の新規を連れてくる）

### Phase別KPI

| Phase | 期間 | センターピン | 主要KPI | 目標値 |
|---|---|---|---|---|
| **0.5（β）** | W1-4 | 藤野型が結果URLをクライアントに送ったか | 共有URL生成率 | β参加者の60%以上が1回以上生成 |
| **1** | W4-8 | 依頼書を外に送ったか | Starter転換率 | 5% |
| **2** | W8-16 | レポートを組織内転送したか | Pro転換率 | 15% |
| **3** | W16-24 | チーム全員のデフォルトになったか | Business契約数 | 3社 |

---

## 4. Phase別計測設計

### Phase 0.5（W1-4）：タブ1 + 共有URL + Chrome拡張

**ファネル**：
```
サイト訪問 → URL入力 → 分析完了 → タブ1閲覧 → 共有URL生成 → 共有URL経由新規
```

| ステップ | 目標転換率 | 計測イベント |
|---|---|---|
| サイト訪問 → URL入力 | > 40% | `url_submitted` / `page_viewed` |
| URL入力 → 分析完了 | > 85% | `analysis_completed` / `url_submitted` |
| 分析完了 → タブ1閲覧（30秒以上） | > 70% | `tab_viewed(tab=lp_analysis, duration>30s)` |
| タブ1閲覧 → 共有URL生成 | > 20% | `share_url_generated` / `tab_viewed` |
| 共有URL生成 → 共有URL経由新規 | > 10% | `share_url_new_user` / `share_url_generated` |

### Phase 1（W4-8）：+ タブ2 + Starter

**追加ファネル**：
```
タブ1閲覧 → タブ2ロック表示 → Starter検討 → Starter課金 → タブ2利用
```

| ステップ | 目標転換率 | 計測イベント |
|---|---|---|
| タブ1閲覧 → タブ2ロック表示閲覧 | > 30% | `locked_tab_viewed(tab=ad_copy)` |
| タブ2ロック表示 → Pricing閲覧 | > 15% | `pricing_viewed` |
| Pricing閲覧 → Starter課金 | > 30% | `subscription_started(plan=starter)` |
| 依頼書ダウンロード率 | > 50%（Starter利用者） | `handoff_downloaded` |

### Phase 2（W8-16）：+ タブ3-5 + Pro

**追加ファネル**：
```
Starter利用 → GSC/GA4連携 → タブ3-5利用 → Pro課金 → レポート生成 → 組織内転送
```

| ステップ | 目標転換率 | 計測イベント |
|---|---|---|
| Starter → GSC連携 | > 40% | `gsc_connected` |
| GSC連携 → Pro課金 | > 25% | `subscription_started(plan=pro)` |
| Pro利用者のレポート生成率 | > 60% | `report_generated` |
| レポート転送率 | > 30% | `report_shared` |

### Phase 3（W16-24）：+ タブ6 + Business

**追加ファネル**：
```
Pro利用 → タブ6ロック表示 → Business問い合わせ → 契約
```

| ステップ | 目標 | 計測イベント |
|---|---|---|
| Pro → Business問い合わせ | > 5% | `business_inquiry` |
| Business契約 | 3社 | `subscription_started(plan=business)` |
| チーム内メンバー追加率 | > 3名/社 | `team_member_added` |

---

## 5. イベント辞書 v3.0

### コアイベント（Phase 0.5〜）

| イベント | 発火タイミング | プロパティ |
|---|---|---|
| `page_viewed` | Webダッシュボードページ表示 | path, referrer, utm_source, utm_medium |
| `url_submitted` | URL入力して分析開始 | url_hash, source(web/extension), is_first |
| `analysis_started` | パイプライン開始 | analysis_id, url_hash |
| `analysis_step_completed` | パイプライン各ステップ完了 | analysis_id, step(research/vision/diagnosis/handoff), duration_ms |
| `analysis_completed` | パイプライン全体完了 | analysis_id, duration_ms, tab_count, has_vision |
| `analysis_failed` | パイプライン失敗 | analysis_id, step, error_code |
| `tab_viewed` | タブ切り替え | analysis_id, tab(lp_analysis/ad_copy/market/traffic/competitor/business), duration_ms |
| `locked_tab_viewed` | ロックタブをクリック | tab, current_plan |
| `share_url_generated` | 共有URLを生成（コピー or シェア） | analysis_id, method(copy/twitter/line/email) |
| `share_url_viewed` | 共有URLが閲覧された | analysis_id, viewer_is_new |
| `share_url_new_user` | 共有URL経由で新規が分析開始 | analysis_id, referrer_analysis_id |
| `handoff_downloaded` | 依頼書ダウンロード | analysis_id, format(md/pdf) |
| `handoff_copied` | 依頼書クリップボードコピー | analysis_id |
| `yakuji_check_triggered` | 薬機法チェック実行 | analysis_id, violation_count |

### 課金イベント（Phase 1〜）

| イベント | 発火タイミング | プロパティ |
|---|---|---|
| `pricing_viewed` | プラン選択ページ表示 | current_plan, referrer_tab |
| `subscription_started` | 課金開始 | plan(starter/pro/business), price, trial |
| `subscription_cancelled` | 解約 | plan, reason, usage_count |
| `subscription_upgraded` | プランアップグレード | from_plan, to_plan |

### 連携イベント（Phase 2〜）

| イベント | 発火タイミング | プロパティ |
|---|---|---|
| `gsc_connected` | GSC OAuth連携完了 | site_count |
| `ga4_connected` | GA4 OAuth連携完了 | property_count |
| `gsc_data_used` | GSCデータがAI分析に使用された | query_count, has_ctr |
| `ga4_data_used` | GA4データがAI分析に使用された | has_cvr, has_bounce |
| `report_generated` | 週次レポート生成 | type(weekly/adhoc), format(pdf/email) |
| `report_shared` | レポート転送 | method(email/slack/download) |

### Chrome拡張イベント

| イベント | 発火タイミング | プロパティ |
|---|---|---|
| `extension_installed` | Chrome拡張インストール完了 | version |
| `extension_sidepanel_opened` | Side Panel表示 | current_url_hash |
| `extension_analyze_clicked` | 拡張から分析開始 | url_hash |
| `extension_to_dashboard` | 拡張からWebダッシュボードへ遷移 | target_page |

### チームイベント（Phase 3〜）

| イベント | 発火タイミング | プロパティ |
|---|---|---|
| `team_created` | チーム作成 | team_id |
| `team_member_added` | メンバー追加 | team_id, member_count |
| `business_inquiry` | Business問い合わせ | company_size, current_plan |

---

## 6. フライホイール健全性指標

3つのフライホイールループが健全に回転しているかを常時モニタリングする。

### Loop 1: バイラルループ（日〜週で回転）

```
分析完了 → 共有URL生成 → 共有URL閲覧 → 新規分析 → …
```

| 指標 | 健全 | 注意 | 危険 |
|---|---|---|---|
| 共有URL生成率（分析完了あたり） | > 20% | 10-20% | **< 10%** |
| 共有URL→新規転換率 | > 15% | 5-15% | < 5% |
| バイラル係数 K | > 1.0 | 0.5-1.0 | < 0.5 |
| 共有URL経由の新規分析開始までの時間 | < 24h | 24-72h | > 72h |

**危険信号時のアクション**：
- 共有URL生成率 < 10% → 共有導線のUI改善、生成タイミングの見直し
- K < 0.5 → 共有URL閲覧ページのCTA改善、OGP最適化

### Loop 2: 品質ループ（月で回転）

```
分析件数増 → パターンDB蓄積 → 分析品質向上 → 利用頻度増 → …
```

| 指標 | 健全 | 注意 | 危険 |
|---|---|---|---|
| 月間分析件数成長率 | > 20% MoM | 5-20% | < 5% |
| パターンDB新規登録数/月 | > 50件 | 20-50件 | < 20件 |
| 同業種2回目以降の分析精度向上率 | > 15% | 5-15% | < 5% |
| Vision API分析成功率 | > 95% | 90-95% | < 90% |

**危険信号時のアクション**：
- 分析件数成長鈍化 → 獲得チャネルの見直し、SEOコンテンツ投資
- パターンDB蓄積不足 → 蓄積ロジックの改善、手動キュレーション

### Loop 3: 収益ループ（四半期で回転）

```
有料転換 → コンテンツ投資 → SEO流入 → Free増 → 有料転換 → …
```

| 指標 | 健全 | 注意 | 危険 |
|---|---|---|---|
| Free → Starter転換率 | > 5% | 2-5% | < 2% |
| Starter → Pro転換率 | > 15% | 5-15% | < 5% |
| 月次チャーン率 | < 5% | 5-10% | > 10% |
| LTV/CAC | > 3.0 | 1.5-3.0 | < 1.5 |

**危険信号時のアクション**：
- 転換率低下 → ロックタブのティーザー内容改善、トライアル設計見直し
- チャーン率上昇 → 解約理由分析、機能改善優先度の見直し

---

## 7. ガードレール

| 項目 | NGライン | 優先度 | 対応 |
|---|---|---|---|
| プロンプト漏洩 | 0件 | P0 | 即時停止、24h以内に原因特定 |
| 個人情報漏洩 | 0件 | P0 | 即時停止、関係者通知 |
| 薬機法チェック漏れ（対象LP） | 0件 | P0 | 該当分析の共有URL停止 |
| 根拠なし提案 | 0件 | P0 | プロンプト回帰テスト |
| 依頼書必須項目欠落率 | < 2% | P0 | テンプレート修正 |
| 分析パイプライン成功率 | > 95% | P0 | アラート → エンジニア対応 |
| 共有URL生成率（Phase 0.5） | > 10% | P1 | UI改善スプリント |
| Vision API分析成功率 | > 90% | P1 | フォールバック処理確認 |
| Webダッシュボード LCP | < 3秒 | P1 | パフォーマンス最適化 |

---

## 8. 運用ルール

### 日次

- L0事故 = 0 の確認（自動アラート）
- プロンプト漏洩チェック（出力サンプリング10件/日）
- 分析パイプライン成功率の確認

### 週次（30分）

- バイラル係数 K の推移確認
- 共有URL生成率・転換率の確認
- フライホイール健全性3指標の確認
- Phase別センターピンの進捗確認
- 保留・失敗分析のトップ3原因確認

### 月次

- プロンプト回帰テスト（代表30URLで品質確認）
- Vision API精度検証（誤検出率の確認）
- 薬機法チェックの精度検証（対象業種10LP）
- パターンDB棚卸し（不良パターンの除去）
- タブ間品質比較（タブ1の精度 vs タブ2-6）
- フライホイール健全性レポート発行

### 事故対応

| レベル | 定義 | 対応 |
|---|---|---|
| SEV-1 | プロンプト漏洩・個人情報漏洩 | 即時停止 → 30分以内アラート → 24h以内根本原因特定 |
| SEV-2 | 分析パイプライン全面停止 | 30分以内アラート → 2h以内復旧 → 48h以内根本原因特定 |
| SEV-3 | 特定タブの品質劣化 | 翌営業日対応 → 1週間以内修正 |
| SEV-4 | UI不具合・パフォーマンス低下 | バックログ登録 → 次スプリントで対応 |
