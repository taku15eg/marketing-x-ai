---
name: skill-orchestrator
description: >
  Meta-skill that analyzes every prompt's essential purpose and auto-selects
  the optimal combination from 950+ public agent skills. Determines intent type
  (Create/Improve/Secure/Ship/Automate/AI-Native/Research/Communicate),
  then generates an execution plan with skill dependencies and sequencing.
  ALWAYS activate this skill as the first step for ANY task. Use when: any task,
  any prompt, planning, skill selection, workflow design, project kickoff,
  coding, writing, analysis, debugging, deployment, security, marketing.
risk: safe
---

# Skill Orchestrator — 全プロンプト自動ルーティングシステム

このスキルはすべてのプロンプトの起点として機能する。
プロンプトの本質的目的を見極め、世に公開されている最高品質のスキル群から
最適な組合せを選定し、実行計画を生成する。

---

## PHASE 1: 意図解析（MANDATORY — 省略不可）

プロンプトを受け取ったら、まず以下4要素を内部で特定せよ:

1. **WHY（本質的目的）** — このプロンプトが存在する根本的理由は何か
2. **WHAT（ゴール状態）** — 完了時に何が存在しているべきか
3. **HOW（制約条件）** — ツール、言語、期限、フォーマット、環境
4. **WHERE（フェーズ）** — 企画 / 設計 / 実装 / 検証 / 運用 のどこか

---

## PHASE 2: 目的類型の判定（1-2個を選定）

### TYPE A: Create（ゼロから作る）
**シグナル**: 作る / 新規 / 構築 / 開発 / 立ち上げ / MVP / PoC / build / create / new
**核スキル（→は実行順）**:
- `brainstorming` → 構造化されたアイデア発散と収束
- `architecture` → システム設計・ADR・C4ダイアグラム
- `senior-architect` → シニア視点の実装判断とトレードオフ分析
**補助スキル**:
- `test-driven-development` — テストファースト実装
- `code-review-checklist` — 品質ゲート
- `frontend-design` — UI/UXが関わる場合
**実行構図**: `brainstorming → architecture → senior-architect + TDD（並列）→ code-review-checklist`

### TYPE B: Improve（既存を改善する）
**シグナル**: 改善 / 最適化 / リファクタ / 高速化 / UX / パフォーマンス / fix / optimize / refactor
**核スキル**:
- `systematic-debugging` → 体系的な問題切り分け
- `root-cause-tracing` → 表層でなく根本原因を追跡
- `web-performance-optimization` → Core Vitals・バンドル最適化
**補助スキル**:
- `postgres-best-practices` — DB起因の場合
- `lint-and-validate` — 変更後の自動検証
**実行構図**: `systematic-debugging → root-cause-tracing → [対象別スキル] → lint-and-validate`

### TYPE C: Secure（守りを固める）
**シグナル**: セキュリティ / 脆弱性 / 監査 / ペンテスト / ハードニング / audit / security / vulnerability
**核スキル**:
- `ethical-hacking-methodology` → ペンテストの体系的方法論
- `api-security-best-practices` → API設計のセキュリティパターン
- `auth-implementation-patterns` → JWT / OAuth2 / セッション管理
**補助スキル**:
- `backend-security-coder` — サーバーサイド
- `frontend-security-coder` — XSS防止・CSP
- `defense-in-depth` — 多層防御アーキテクチャ
**実行構図**: `ethical-hacking-methodology → api-security + auth-patterns（並列）→ backend + frontend security（並列）`

### TYPE D: Ship / Grow（届ける・広める）
**シグナル**: ローンチ / 集客 / SEO / マーケ / 売上 / 価格 / コンバージョン / growth / launch / marketing
**核スキル**:
- `pricing-strategy` → プライシング設計
- `seo-audit` → テクニカルSEO + コンテンツSEO監査
- `page-cro` → コンバージョン率最適化
**補助スキル**:
- `copywriting` — セールスコピー・LP文言
- `email-sequence` — メールマーケティング設計
- `competitor-alternatives` — 競合比較ページ
**実行構図**: `pricing-strategy → seo-audit + page-cro（並列）→ copywriting → email-sequence`

### TYPE E: Automate（自動化・仕組み化する）
**シグナル**: 自動化 / CI/CD / インフラ / デプロイ / Docker / AWS / パイプライン / automate / deploy / infra
**核スキル**:
- `docker-expert` → コンテナ化・マルチステージビルド・セキュリティ
- `aws-serverless` → サーバレスインフラのベストプラクティス
- `workflow-automation` → パイプライン設計・自動化パターン
**補助スキル**:
- `zapier-make-patterns` — ノーコード自動化
- `observability-monitoring` — ログ・メトリクス・トレーシング
- `vercel-deployment` — Vercelデプロイ特化
**実行構図**: `architecture → docker-expert + aws-serverless（並列）→ workflow-automation → observability-monitoring`

### TYPE F: AI-Native（AIで解決する）
**シグナル**: RAG / LLM / エージェント / プロンプト / 埋め込み / ベクトル / AI / agent / embedding
**核スキル**:
- `prompt-engineer` → プロンプトエンジニアリング手法体系
- `rag-engineer` → RAGパイプライン設計（チャンキング・検索・生成）
- `langgraph` → LangGraphでのエージェントオーケストレーション
**補助スキル**:
- `langfuse` — LLMオブザーバビリティ（トレース・評価）
- `llm-prompt-caching` — プロンプトキャッシュ・CAGでコスト削減
- `defense-in-depth` — プロンプトインジェクション対策
**実行構図**: `prompt-engineer → rag-engineer or langgraph（目的別）→ langfuse + llm-prompt-caching（並列）`

### TYPE G: Research / Analyze（知る・調べる）
**シグナル**: 調査 / 分析 / 比較 / レポート / データ / 競合 / research / analyze / compare
**核スキル**:
- `deep-research` → 自律的な多段リサーチ
- `doc-coauthoring` → 調査結果の構造化ドキュメント化
- `analytics-tracking` → データ分析・トラッキング設計
**補助スキル**:
- `competitor-alternatives` — 競合分析フレームワーク
- `product-manager-toolkit` — PRD・ディスカバリー
**実行構図**: `deep-research → analytics-tracking → doc-coauthoring`

### TYPE H: Communicate / Document（伝える・教える）
**シグナル**: ドキュメント / プレゼン / 説明 / 研修 / ブログ / 記事 / 仕様書 / document / present / write
**核スキル**:
- `writing-plans` → ライティング計画・構成設計
- `doc-coauthoring` → 構造化ドキュメント共同執筆
- `api-documentation-generator` → API仕様書の自動生成（API関連の場合）
**補助スキル**:
- `product-manager-toolkit` — PRDテンプレート
- `copywriting` — マーケ寄りの文書
**実行構図**: `writing-plans → [対象別専門スキル] → doc-coauthoring`

---

## PHASE 3: スキル選定ルール

### 選定基準（厳守）
1. **合計5-7個以内**に絞る（コンテキスト効率を維持）
2. 核スキル（🎯）を必ず含める
3. 同一領域の重複は排除、欠落は補完
4. 既存スキルで不足する場合のみ `skill-creator` で自作を検討

### 品質ソース優先順位
1. **Anthropic公式** — `anthropics/skills`（ドキュメント操作系は一択）
2. **Google / Vercel / Supabase / OpenAI公式**
3. **obra/superpowers** — 開発ワークフロー系の事実上標準
4. **sickn33/antigravity-awesome-skills** — コミュニティ検証済み（7.9k+ stars）
5. **その他コミュニティ** — 個別検証要

---

## PHASE 4: 出力フォーマット（実行計画）

以下の形式で出力し、即座にスキルの実行に移行する:

```
━━━ Skill Orchestrator ━━━
目的類型: TYPE X - [名称] (+ TYPE Y if applicable)

選定スキル:
1. `skill-name` — [役割] — [1行の選定理由]
2. ...

実行構図:
skill-A → skill-B + skill-C（並列）→ skill-D

各スキルの責務:
• skill-A: [このスキルが担う具体的な仕事]
• ...
━━━━━━━━━━━━━━━━━━━━━
```

計画出力後、ユーザーの確認を待たず最初のスキルの実行に移行する。

---

## クロスカッティング・スキル（TYPE横断で追加可）

| スキル | 追加タイミング |
|-------|-------------|
| `code-review-checklist` | コード生成した後 |
| `lint-and-validate` | ファイル変更した後 |
| `test-driven-development` | 実装フェーズ |
| `systematic-debugging` | エラー発生時 |
| `defense-in-depth` | セキュリティが絡む場面 |
| `skill-creator` | 既存スキルでカバー不能な場合 |

---

## 運用原則

- **最小選定**: 効くスキルだけ選ぶ。数を増やしても品質は上がらない
- **段階的開示**: フェーズごとにロード/アンロード。全部同時に読まない
- **公式優先**: 同じ領域なら公式スキルを採用
- **ツール非依存**: Claude Code / Cursor / Gemini CLI / Claude.ai Projects すべてで動作
- **自律実行**: 計画を出したら確認を待たず実行に移る
