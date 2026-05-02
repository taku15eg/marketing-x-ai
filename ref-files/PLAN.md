# PLAN.md — Publish Gate Phase 0.5 MVP 開発計画

> **このファイルの役割**: セッションをまたぐたびに記憶を失うClaude Codeが、毎回最初に読む「引き継ぎメモ」。
> CLAUDE.mdが「ワークスペース全体のルール」、PLAN.mdが「今のフェーズの設計図と進捗」。
> 作業後は必ず「PLAN.mdの進捗を更新して」と指示すること。

---

## ゴール定義

**Phase 0.5 MVP = 「URLを入れたら、LP分析結果が共有URLで外に出せる」状態**

作るもの：
- Webダッシュボード（タブ1 LP分析のみ）
- 共有可能な分析結果URL
- Chrome拡張 Side Panel（分析トリガー＋結果表示）

作らないもの：
- タブ2-6（広告訴求/市場/流入/競合/事業）
- アカウント認証（Googleログイン）
- メール通知、CSVエクスポート
- 課金機能

対象ユーザー：藤野型 3-5名
センターピン：**分析結果URLをクライアントに送ったか**

---

## 技術スタック（確定）

| レイヤー | 技術 | 理由 |
|---------|------|------|
| フロントエンド | Next.js (App Router) | Webダッシュボード。SSR+SEO対応 |
| UIライブラリ | shadcn/ui + Tailwind CSS | プロダクション品質。車輪の再発明を避ける |
| バックエンド | Cloudflare Workers | v3.2コード流用。エッジ実行 |
| DB | Supabase (PostgreSQL + Storage) | 分析結果の保存+共有URL |
| 認証 | Supabase Auth | Phase 1で導入。0.5では匿名利用 |
| AI | Claude API (Vision + text) | 分析エンジン本体 |
| Chrome拡張 | Manifest V3 + Side Panel API | リテンション用。v3.2コード流用 |
| デプロイ | Vercel (Web) + Chrome Web Store (拡張) | 最速デプロイ |

**車輪の再発明禁止リスト:**
- 認証 → Supabase Auth（自前実装しない）
- UI → shadcn/ui（ボタン/モーダル/フォーム等自作しない）
- スタイリング → Tailwind CSS（カスタムCSS最小限）
- アイコン → Lucide React
- フォーム → react-hook-form + zod
- HTTP → ky or fetch（axios不要）
- 日付 → date-fns（moment不要）

---

## 開発タスク（LEGOブロック式分割）

各タスクは独立して動作確認可能な単位。完了したらGitコミット。

### Block 1: プロジェクト基盤 (Day 1)
- [ ] 1-1. Next.js + shadcn/ui + Tailwind 初期セットアップ
- [ ] 1-2. ディレクトリ構造確定（src/app, src/components, src/lib）
- [ ] 1-3. 環境変数設定（.env.local → CLAUDE_API_KEY, SUPABASE_URL等）
- [ ] 1-4. Supabase プロジェクト作成 + テーブル設計（analyses, shared_urls）
- [ ] 1-5. Cloudflare Worker セットアップ（v3.2 proxy-worker流用）

### Block 2: URL入力 → 分析API呼び出し (Day 2)
- [ ] 2-1. URL入力フォーム（バリデーション付き）
- [ ] 2-2. 分析APIエンドポイント（CF Worker: URL受信 → 企業情報fetch → Vision API → 診断）
- [ ] 2-3. ローディングUI（分析中の進捗表示）
- [ ] 2-4. エラーハンドリング（無効URL、タイムアウト、APIエラー）

### Block 3: 分析結果表示 (Day 3)
- [ ] 3-1. 結果ページレイアウト（Ahrefs Site Explorer風）
- [ ] 3-2. 課題一覧コンポーネント（インパクト順ソート）
- [ ] 3-3. 課題詳細ドリルダウン（アコーディオン展開）
- [ ] 3-4. 依頼書パック表示（構造変化図示、コピー文言は出さない）
- [ ] 3-5. 薬機法チェック結果表示

### Block 4: 共有URL生成 (Day 4)
- [ ] 4-1. 分析結果をSupabaseに保存
- [ ] 4-2. 共有URL生成（/report/[id] 形式）
- [ ] 4-3. 共有ページ（未ログインでも閲覧可能）
- [ ] 4-4. OGP/メタタグ設定（SNS共有時のプレビュー）
- [ ] 4-5. 「Powered by Publish Gate」フッター（バイラル導線）

### Block 5: Chrome拡張 Side Panel (Day 5)
- [ ] 5-1. Manifest V3 + Side Panel基盤（v3.2コード流用）
- [ ] 5-2. content-script: 現在ページURL取得 + DOM抽出
- [ ] 5-3. Side Panel UI: 分析結果表示
- [ ] 5-4. 「Webダッシュボードで詳しく見る」リンク
- [ ] 5-5. 拡張アイコンバッジ（分析完了通知）

### Block 6: 統合テスト + β配布準備 (Day 6)
- [ ] 6-1. SEVENDEX LP での統合テスト
- [ ] 6-2. 喜界島薬草農園LP での統合テスト
- [ ] 6-3. セキュリティチェック（SEC-1〜SEC-13 from TEST-SCENARIOS.json）
- [ ] 6-4. Vercelデプロイ + ドメイン設定
- [ ] 6-5. β版招待メール文面作成 + 藤野型3-5名にURL送付

---

## 進捗記録

| 日付 | 完了タスク | 次のタスク | 備考 |
|------|-----------|-----------|------|
| (未着手) | — | Block 1-1 から開始 | |

---

## デザイン方向性

- **Ahrefs Site Explorer**をUXリファレンスとする（URL入力→結果→深掘り）
- ダークモード対応不要（Phase 0.5では）
- レスポンシブ対応必須（モバイルでも結果閲覧可能）
- AIっぽさを排除：紫グラデーション禁止、Inter以外のフォント推奨（Noto Sans JP）
- 信頼感のあるプロフェッショナルなデザイン

---

## リサーチメモ（必要に応じて追記）

> Plan Modeで調査した内容、技術選定の比較結果などをここに追記する。
> 大量になる場合は RESEARCH.md として切り出す。

---

## 最終更新: (未開始)
