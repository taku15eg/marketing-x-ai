# PROJECT_STATUS.md — Publish Gate

**更新日**: 2026-03-14
**Phase**: 0 (現状把握と正本確定)

---

## 1. リポジトリ棚卸し

### 3つのコンポーネント

| コンポーネント | パス | 技術 | 状態 |
|---------------|------|------|------|
| Dashboard (本体) | `src/dashboard/` | Next.js 15 + Tailwind 4 + TypeScript | ✅ 実装済み |
| Chrome拡張 | `src/extension/` | Manifest V3 + Side Panel API | ✅ 実装済み（API接続に問題あり） |
| Proxy Worker | `src/proxy/worker.js` | Cloudflare Workers | ⚠️ 旧アーキテクチャ（Dashboard APIと不整合） |

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
| Service Worker | `background/service-worker.js` | ⚠️ 問題あり | 後述のAPI不整合 |
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
| Unit (vitest) | 9 | 174 | ✅ 全パス |
| E2E (playwright) | 4 | — | ⚠️ 記述済み・未実行 |
| TypeCheck | — | — | ✅ エラーなし |
| Lint | — | — | 未確認 |

---

## 2. 最重要問題: 2つのAPI アーキテクチャの並存

### [事実] コードベースに2つの分析パイプラインが存在する

**Dashboard API** (`src/dashboard/app/api/analyze/route.ts`):
- 入力: `{ url: string }`
- サーバーサイドでHTML取得 → DOM抽出 → Screenshot取得 → Claude API
- 出力: `AnalyzeResponse { id, url, status, result: AnalysisResult }`
- AnalysisResult = company_understanding + page_reading + issues[] + regulatory

**Worker API** (`src/proxy/worker.js`):
- 入力: `{ page_features, layer, judgment_history, gsc_data, ga4_data }`
- クライアント(拡張)がDOM抽出済みデータを送信
- 出力: `{ goal_card, judgment: PASS|FAIL|HOLD, proposals[] }`

### [事実] 拡張はDashboard APIを向いているが、Worker形式のデータを送る

- `constants.js`: `API_BASE = 'http://localhost:3000'` → Dashboard
- `service-worker.js`: `{ url, page_features }` を送信
- Dashboard APIは `page_features` を無視し、`url` だけ使ってサーバーサイドfetch

### [仮説] 実行時の挙動

拡張からの分析リクエストは、Dashboard APIに届く場合:
- `url`は送っているので、分析自体は動く可能性がある
- ただし`page_features`や`screenshot`は無視される
- 拡張のcontent scriptによるDOM抽出は無駄になる
- 拡張のスクリーンショットも無視される

### [要確認]

1. 拡張経由でDashboard APIを叩いた場合、実際にレスポンスが拡張UIで正しく表示されるか
2. Worker APIは今後も使うのか、Dashboard APIに統一するのか
3. 拡張独自のDOM抽出は今後どう活用するか

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
- Unit Tests: ✅ 174/174 パス
- Build: 未確認（node_modules依存）
- Lint: 未確認
- E2E: 未実行
