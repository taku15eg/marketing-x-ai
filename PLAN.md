# PLAN.md — Publish Gate Phase 0.5 MVP 開発計画

> **このファイルの役割**: セッションをまたぐたびに記憶を失うClaude Codeが、毎回最初に読む「引き継ぎメモ」。
> CLAUDE.mdが「ワークスペース全体のルール」、PLAN.mdが「今のフェーズの設計図と進捗」。
> 作業後は必ず「PLAN.mdの進捗を更新して」と指示すること。

---

## ゴール定義

**Phase 0.5 MVP = 「URLを入れたら、LP分析結果が共有URLで外に出せる」状態**

作るもの：
- Webダッシュボード（タブ1 LP分析 + タブ2 実験ノート）
- 共有可能な分析結果URL
- Chrome拡張 Side Panel（分析トリガー＋結果表示）

作らないもの：
- タブ3-6（広告訴求/市場/流入/競合/事業）
- アカウント認証（Googleログイン）
- メール通知、CSVエクスポート
- 課金機能

対象ユーザー：藤野型 3-5名
センターピン：**分析結果URLをクライアントに送ったか**

---

## 技術スタック（確定）

| レイヤー | 技術 | 理由 |
|---------|------|------|
| フロントエンド | Next.js (App Router) | SSR+SEO対応 |
| スタイリング | Tailwind CSS | プロダクション品質 |
| バックエンド | Next.js API Route | Phase 0.5は同一PJでシンプルに（Workers移行はスケール時） |
| DB | localStorage（Phase 0.5） → Supabase（Phase 1） | 匿名利用のため |
| AI | Claude API (Vision + text) | 分析エンジン本体 |
| Chrome拡張 | Manifest V3 + Side Panel API | リテンション用 |
| デプロイ | Vercel (Web) + Chrome Web Store (拡張) | 最速デプロイ |

---

## 開発タスク（LEGOブロック式分割）

各タスクは独立して動作確認可能な単位。完了したらGitコミット。

### Block 1: プロジェクト基盤 ✅ DONE
- [x] 1-1. Next.js + Tailwind 初期セットアップ
- [x] 1-2. ディレクトリ構造確定（src/dashboard/app, components, lib）
- [x] 1-3. 環境変数設定（.env.local → ANTHROPIC_API_KEY）
- [x] 1-4. types.ts 設計（v8-enriched Proposal構造）

### Block 2: URL入力 → 分析API ✅ DONE
- [x] 2-1. URL入力フォーム（バリデーション + SSRF防御）
- [x] 2-2. 分析APIエンドポイント（app/api/analyze/route.ts）
- [x] 2-3. ローディングUI（4ステップ進捗表示）
- [x] 2-4. エラーハンドリング（無効URL、タイムアウト、APIエラー）
- [x] 2-5. レート制限（rate-limiter.ts）

### Block 3: 分析結果表示 ✅ DONE
- [x] 3-1. AnalysisResult.tsx（インサイト + 企業理解 + ページ読み取り）
- [x] 3-2. ProposalCard.tsx（アコーディオン展開）
- [x] 3-3. EvidenceChainSection.tsx（根拠チェーン4ステップ）
- [x] 3-4. BeforeAfterSection.tsx
- [x] 3-5. BriefTabs.tsx（デザイナー/エンジニア切り替え）
- [x] 3-6. ContextSection.tsx / ExpectedImpactSection.tsx / SourceTag.tsx
- [x] 3-7. 薬機法・景表法チェック結果表示

### Block 4: 共有URL ✅ DONE
- [x] 4-1. 共有URL生成（nanoid 21文字）
- [x] 4-2. 共有ページ（app/share/[id]/page.tsx — 未ログインでも閲覧可能）
- [x] 4-3. ShareButton.tsx + SocialShareButtons.tsx
- [x] 4-4. PoweredByBadge.tsx（バイラル導線）

### Block 5: 実験ノート ✅ DONE
- [x] 5-1. ExperimentLog型定義
- [x] 5-2. experiment-store.ts（localStorage管理、20件上限）
- [x] 5-3. ExperimentLogList.tsx
- [x] 5-4. TabNavigation.tsx（分析 ↔ 実験ノート切り替え）

### Block 6: Chrome拡張 ✅ DONE
- [x] 6-1. Manifest V3 + Side Panel基盤
- [x] 6-2. Side Panel UI: URL取得 + 分析トリガー + 結果表示
- [x] 6-3. 「ダッシュボードで詳しく見る」リンク

### Block 7: ランディングページ ✅ DONE
- [x] 7-1. Hero + URL入力
- [x] 7-2. Features / Pain / Demo セクション
- [x] 7-3. ChatGPT比較テーブル
- [x] 7-4. ペルソナフロー（3アーキタイプ）
- [x] 7-5. 料金プラン表
- [x] 7-6. FAQ + Bottom CTA + Footer

### Block 8: テスト + セキュリティ 🔄 IN PROGRESS
- [x] 8-1. analyzer.test.ts
- [x] 8-2. prompt-builder.test.ts
- [x] 8-3. rate-limiter.test.ts
- [x] 8-4. security.test.ts（SSRF防御）
- [x] 8-5. url-cache.test.ts
- [x] 8-6. api-integration.test.ts
- [ ] 8-7. 全テスト通過確認 + CI設定
- [ ] 8-8. E2Eテスト（SEVENDEX LP / 喜界島薬草農園LP）

### Block 9: β配布準備 ⬜ TODO
- [ ] 9-1. Vercelデプロイ + ドメイン設定
- [ ] 9-2. Chrome Web Store 申請準備
- [ ] 9-3. β版招待メール文面作成
- [ ] 9-4. 藤野型3-5名にURL送付

---

## 進捗記録

| 日付 | 完了タスク | 次のタスク | 備考 |
|------|-----------|-----------|------|
| 〜03-11 | Block 1-7 完了 | Block 8 テスト整備 | v8-enriched構造、全コンポーネント、LP完成 |
| 03-12 | CLAUDE.md v5.0統合、DECISIONS.md/PLAN.md作成 | Block 8-7 テスト通過 | 梶谷式ワークフローに移行 |

---

## デザイン方向性

- **Ahrefs Site Explorer**をUXリファレンスとする（URL入力→結果→深掘り）
- ダークモード対応不要（Phase 0.5では）
- レスポンシブ対応必須（モバイルでも結果閲覧可能）
- AIっぽさを排除：紫グラデーション禁止、Noto Sans JP + Outfit
- 信頼感のあるプロフェッショナルなデザイン。ブランドカラー #2563EB

---

## 最終更新: 2026-03-12
