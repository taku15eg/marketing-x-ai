# PROJECT_STATUS.md — Publish Gate

**更新日**: 2026-03-14
**Phase**: 8 (最終整備完了)

---

## 1. リポジトリ棚卸し

### 3つのコンポーネント

| コンポーネント | パス | 技術 | 状態 |
|---------------|------|------|------|
| Dashboard (本体) | `src/dashboard/` | Next.js 15 + Tailwind 4 + TypeScript | ✅ 実装済み |
| Chrome拡張 | `src/extension/` | Manifest V3 + Side Panel API | ✅ 実装済み（Dashboard API直接接続） |
| Proxy Worker | `src/proxy/worker.js` | Cloudflare Workers | ⚠️ @deprecated（Dashboard APIが正本） |

### Dashboard (src/dashboard/) — 実装状況

| モジュール | ファイル | 状態 | 備考 |
|-----------|---------|------|------|
| 型定義 | `lib/types.ts` | ✅ 実装済み | AnalysisResult, Issue, CTAInfo等 |
| URL検証 / SSRF防御 | `lib/url-validator.ts` | ✅ 実装済み | DNS rebinding防御含む |
| 企業リサーチ (Step 1) | `lib/company-research.ts` | ✅ 実装済み | HTML fetch + ブランドトーン抽出 |
| ページ読取 (Step 2) | `lib/page-reader.ts` | ✅ 実装済み | DOM抽出 + Screenshot API連携 |
| プロンプト + Claude API (Step 3-4) | `lib/prompt-builder.ts` | ✅ 実装済み | 構造化JSON出力 + 薬機法/景表法チェック |
| パイプラインオーケストレータ | `lib/analyzer.ts` | ✅ 実装済み | 4ステップ実行 + インメモリStore |
| レート制限 | `lib/rate-limiter.ts` | ✅ 実装済み | インメモリ（月5回/分10回） |
| イベントロガー | `lib/event-logger.ts` | ✅ 実装済み | インメモリring buffer |
| HTMLユーティリティ | `lib/html-utils.ts` | ✅ 実装済み | サニタイズ + strip |
| CORS設定 | `lib/cors.ts` | ✅ 実装済み | `*` (MVP用) |
| 分析API | `app/api/analyze/route.ts` | ✅ 実装済み | POST + GET |
| 共有API | `app/api/share/route.ts` | ✅ 実装済み | POST + GET |
| トップページ | `app/page.tsx` | ✅ 実装済み | URL入力 + Loading + Error |
| 分析結果ページ | `app/analysis/[id]/page.tsx` | ✅ 実装済み | TabNavigation + AnalysisResult |
| 共有ページ | `app/share/[id]/page.tsx` | ✅ 実装済み | バイラルCTA付き |
| 共有OGP | `app/share/[id]/layout.tsx` | ✅ 実装済み | 分析対象URLは含めない |
| ErrorBoundary | `components/ErrorBoundary.tsx` | ✅ 実装済み | |
| AnalysisResult | `components/AnalysisResult.tsx` | ✅ 実装済み | |
| IssueCard | `components/IssueCard.tsx` | ✅ 実装済み | |
| BriefPanel | `components/BriefPanel.tsx` | ✅ 実装済み | |
| TabNavigation | `components/TabNavigation.tsx` | ✅ 実装済み | 6タブ、Tab1のみアクティブ |
| ShareButton | `components/ShareButton.tsx` | ✅ 実装済み | |
| SocialShareButtons | `components/SocialShareButtons.tsx` | ✅ 実装済み | |
| PoweredByBadge | `components/PoweredByBadge.tsx` | ✅ 実装済み | |
| UrlInput | `components/UrlInput.tsx` | ✅ 実装済み | |
| LoadingProgress | `components/LoadingProgress.tsx` | ✅ 実装済み | |
| Supabase連携 | — | ❌ 未実装 | Phase 1+ |
| 認証/アカウント機能 | — | ❌ 未実装 | Phase 1+ |
| Stripe決済 | — | ❌ 未実装 | Phase 2+ |
| タブ2-6 | — | ❌ 未実装 | Phase 2+ |

### Chrome拡張 (src/extension/) — 実装状況

| モジュール | ファイル | 状態 | 備考 |
|-----------|---------|------|------|
| Manifest V3 | `manifest.json` | ✅ 実装済み | 最小権限 (activeTab, sidePanel) |
| Service Worker | `background/service-worker.js` | ✅ 修正済み | URL+ref送信のみ（Phase 1で修正） |
| Content Script | `content/content-script.js` | ✅ 実装済み | DOM抽出 + PII masking |
| Side Panel UI | `sidepanel/index.html` | ✅ 実装済み | |
| Side Panel App | `sidepanel/app.js` | ✅ 実装済み | 結果表示対応 |
| 定数 | `constants.js` | ✅ 実装済み | API_BASE設定可能 |
| スタイル | `sidepanel/styles.css` | ✅ 実装済み | |
| i18n | `_locales/ja/messages.json` | ✅ 実装済み | |

### Proxy Worker (src/proxy/worker.js) — 実装状況

| エンドポイント | 状態 | 備考 |
|--------------|------|------|
| `/api/v1/analyze` | ✅ 実装済み | 旧スキーマ（page_features入力） |
| `/api/v1/handoff` | ✅ 実装済み | 依頼パック生成 |
| `/api/v1/memo` | ✅ 実装済み | 承認メモ生成 |
| `/health` | ✅ 実装済み | |

### テスト — 現状

| カテゴリ | ファイル数 | テスト数 | 状態 |
|---------|----------|---------|------|
| Unit (vitest) | 13 | 278 | ✅ 全パス |
| E2E (playwright) | 4 | 26 | ⚠️ 記述済み・CI実行待ち |
| TypeCheck | — | — | ✅ エラーなし |
| Lint | — | — | ✅ エラーなし |
| CI | `.github/workflows/ci.yml` | — | ✅ 設定済み |

---

## 2. ~~最重要問題~~ 解決済み: APIアーキテクチャ統一

**Phase 1で解決**: Dashboard APIを正本とし、Worker APIを@deprecated化。
拡張はURL+refのみ送信し、Dashboard APIがサーバーサイドで全分析を実行。
詳細: `DECISIONS.md` DEC-002, DEC-003

---

## 3. その他の未解決問題

### インメモリストアの揮発性
- [事実] 分析結果・共有リンク・レート制限はすべてインメモリ
- [事実] サーバー再起動で全データ消失
- [仮説] β検証では許容可能だが、共有URLの永続性がない
- [要確認] Supabase連携の優先度

### Screenshot APIの外部依存
- [事実] `SCREENSHOT_API_KEY`未設定時はVision APIスキップ
- [事実] CLAUDE.md「Vision APIは省略しない」原則に矛盾
- [仮説] β検証では環境変数設定で対応可能
- [要確認] screenshotone.com APIの料金・制限

### プログレス表示のシミュレーション
- [事実] `page.tsx`のプログレスはsetTimeoutによる疑似表示
- [事実] 実際のパイプラインステップとは連動していない
- [仮説] ユーザー体験として致命的ではないが、不正確

### E2Eテストの未実行
- [事実] Playwright設定・テストファイルは存在する
- [要確認] `npx playwright install`後に実行可能か

---

## 4. セキュリティ状態

| 項目 | CLAUDE.md要件 | 実装状態 |
|------|--------------|---------|
| SSRF防御 | CRITICAL | ✅ URL検証 + DNS rebinding + リダイレクト制限 |
| Share URL ID推測防止 | CRITICAL | ✅ nanoid 21文字 |
| APIキー管理 | HIGH | ✅ サーバーサイド限定 |
| プロンプトインジェクション | HIGH | ✅ XMLタグ + システムプロンプト宣言 |
| XSS防御 | MEDIUM | ✅ dangerouslySetInnerHTML不使用 |
| PII保護 | MEDIUM | ✅ content scriptでマスキング |
| レート制限 | MEDIUM | ✅ インメモリ実装 |
| Chrome拡張最小権限 | LOW | ✅ activeTab + sidePanel のみ |

---

## 5. 品質指標

- TypeCheck: ✅ パス
- Unit Tests: ✅ 278/278 パス
- Lint: ✅ エラーなし
- E2E: ⚠️ 26テスト記述済み、CI実行待ち
- CI: ✅ `.github/workflows/ci.yml` 設定済み

---

## 6. Phase実行サマリ

| Phase | 内容 | テスト数 | 主な成果物 |
|-------|------|---------|----------|
| 0 | 現状把握と正本確定 | 174 | PROJECT_STATUS.md, DECISIONS.md, QA_REPORT.md |
| 1 | API契約統一 | 204 | types.ts拡張, contract.test.ts, Extension修正 |
| 2 | セキュリティ強化 | 212 | DNS rebinding防御, JSON self-heal, compliance_hold_policy.md |
| 3 | CTA抽出強化 | 218 | 5種CTA検出, extraction_quality_matrix.md |
| 4 | パイプライン品質 | 234 | pipeline.test.ts, pipeline_runtime.md |
| 5 | 価値導線検証 | 260 | flow.test.ts, UXバグ修正, E2E更新 |
| 6 | β検証基盤 | 278 | metrics API, event beacon, beta_kpi.md |
| 7 | CI/回帰防止 | 278 | .github/workflows/ci.yml |
| 8 | 最終整備 | 278 | ドキュメント最終化 |
