# Skill Orchestrator Architecture
## プロンプトの本質的目的からスキルを自動選定・組合せるメタ構造

---

## 1. 設計思想：なぜ「メタ構造」が必要か

950+のスキルをそのまま全読み込みすると、コンテキストウィンドウを圧迫し精度が下がる（コンテキスト汚染）。一方、手動で毎回選ぶのは非現実的。

解決策は**「プログレッシブ・ディスクロージャー（段階的開示）」**アーキテクチャ。
エージェントは普段身軽な状態で待機し、プロンプトの目的を分析した瞬間だけ、必要なスキルをロードする。

本設計は、その「分析→選定→組合せ」のロジック自体をスキル化したもの。

---

## 2. ルーティングの全体構造

```
┌─────────────────────────────────────────────────────┐
│                 PROMPT INPUT                         │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 0: Intent Parser（意図解析）                  │
│  ─────────────────────────────────────────────────── │
│  プロンプトから以下を抽出:                            │
│  ① 本質的目的 (WHY)                                  │
│  ② ゴール状態 (WHAT = 完了の定義)                     │
│  ③ 制約条件 (HOW = ツール・言語・期限)                │
│  ④ フェーズ (WHERE = 企画/設計/実装/検証/運用)        │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 1: Domain Router（ドメイン分類）              │
│  ─────────────────────────────────────────────────── │
│  9ドメインのうち該当する1-3ドメインを特定             │
│  → Architecture / Business / Data&AI / Development   │
│    / General / Infrastructure / Security / Testing   │
│    / Workflow                                        │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 2: Skill Selector（スキル選定）               │
│  ─────────────────────────────────────────────────── │
│  各ドメインから「目的に直結する」スキルを1-3個選定    │
│  選定基準:                                           │
│    ・目的との適合度（必須 > 補助 > 不要）             │
│    ・品質（公式 > コミュニティ実証済 > 未検証）       │
│    ・相互補完性（重複を排除、欠落を補完）             │
│  合計: 最大5-7スキルに絞る                            │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 3: Composition Plan（実行計画）               │
│  ─────────────────────────────────────────────────── │
│  スキルの実行順序と依存関係を定義                     │
│  → 直列（A→B→C）or 並列（A+B→C）                    │
│  → 出力: 「選定スキル一覧 + 理由 + 実行構図」        │
└─────────────────────────────────────────────────────┘
```

---

## 3. 目的類型マップ：8つの本質的目的パターン

あらゆるプロンプトは、突き詰めると以下8パターンに分類できる。
各パターンに対して、950+から厳選した「核スキル」と「補助スキル」を定義。

### TYPE A: ゼロから作る（Create）
> 「〇〇を新規に作りたい」

| 役割 | スキル名 | ソース | 選定理由 |
|------|---------|--------|----------|
| 🎯 企画 | `brainstorming` | sickn33/awesome | 構造化されたアイデア発散→収束プロセス |
| 🎯 設計 | `architecture` | sickn33/awesome | システム設計・ADR・C4ダイアグラム生成 |
| 🎯 実装 | `senior-architect` | alirezarezvani | シニアエンジニア視点の実装判断 |
| 🔧 品質 | `code-review-checklist` | sickn33/awesome | 機能性・セキュリティ・品質の体系チェック |
| 🔧 テスト | `test-driven-development` | obra/superpowers | テストファーストで実装の正確性を担保 |

**実行構図**: `brainstorming → architecture → senior-architect + test-driven-development → code-review-checklist`

---

### TYPE B: 既存を改善する（Improve）
> 「パフォーマンス改善」「リファクタ」「UX改善」

| 役割 | スキル名 | ソース | 選定理由 |
|------|---------|--------|----------|
| 🎯 分析 | `systematic-debugging` | obra/superpowers | 体系的な問題特定プロセス |
| 🎯 根本原因 | `root-cause-tracing` | obra/superpowers | 表層でなく根本原因を追跡 |
| 🎯 改善 | `web-performance-optimization` | sickn33/awesome | Core Vitals・バンドルサイズ等の具体改善 |
| 🔧 検証 | `lint-and-validate` | sickn33/awesome | 自動的な品質バリデーション |

**実行構図**: `systematic-debugging → root-cause-tracing → [改善対象の専門スキル] → lint-and-validate`

---

### TYPE C: 守りを固める（Secure / Harden）
> 「セキュリティ監査」「脆弱性対策」「コンプライアンス」

| 役割 | スキル名 | ソース | 選定理由 |
|------|---------|--------|----------|
| 🎯 全体監査 | `ethical-hacking-methodology` | zebbern/guide | ペンテストの体系的方法論（"The Bible"） |
| 🎯 API | `api-security-best-practices` | sickn33/awesome | APIセキュリティの設計パターン |
| 🎯 認証 | `auth-implementation-patterns` | sickn33/awesome | JWT/OAuth2/セッション管理 |
| 🔧 バックエンド | `backend-security-coder` | sickn33/awesome | サーバーサイドのセキュアコーディング |
| 🔧 フロントエンド | `frontend-security-coder` | sickn33/awesome | XSS防止・クライアントサイドセキュリティ |

**実行構図**: `ethical-hacking-methodology（全体計画）→ api-security + auth-implementation（並列）→ backend-security + frontend-security（並列）`

---

### TYPE D: 届ける・広める（Ship / Grow）
> 「ローンチ」「マーケティング」「SEO」「グロース」

| 役割 | スキル名 | ソース | 選定理由 |
|------|---------|--------|----------|
| 🎯 戦略 | `pricing-strategy` | coreyhaines31 | プライシング設計 |
| 🎯 SEO | `seo-audit` | coreyhaines31 | テクニカルSEO+コンテンツSEO監査 |
| 🎯 CRO | `page-cro` | coreyhaines31 | コンバージョン率最適化 |
| 🔧 コピー | `copywriting` | coreyhaines31 | セールスコピー・LP文言 |
| 🔧 配信 | `email-sequence` | coreyhaines31 | メールマーケティングのシーケンス設計 |

**実行構図**: `pricing-strategy → seo-audit + page-cro（並列）→ copywriting → email-sequence`

---

### TYPE E: 自動化・仕組み化する（Automate）
> 「CI/CD構築」「ワークフロー自動化」「インフラ整備」

| 役割 | スキル名 | ソース | 選定理由 |
|------|---------|--------|----------|
| 🎯 コンテナ | `docker-expert` | sickn33/awesome | マルチステージビルド・最適化・セキュリティ |
| 🎯 IaC | `aws-serverless` | sickn33/awesome | サーバレスインフラのベストプラクティス |
| 🎯 CI/CD | `workflow-automation` | sickn33/awesome | パイプライン設計・自動化パターン |
| 🔧 ノーコード | `zapier-make-patterns` | sickn33/awesome | Zapier/Make連携パターン |
| 🔧 監視 | `observability-monitoring` | sickn33/awesome | ログ・メトリクス・トレーシング |

**実行構図**: `architecture → docker-expert + aws-serverless（並列）→ workflow-automation → observability-monitoring`

---

### TYPE F: AIで解決する（AI-Native）
> 「RAG構築」「LLMアプリ」「エージェント開発」「プロンプト設計」

| 役割 | スキル名 | ソース | 選定理由 |
|------|---------|--------|----------|
| 🎯 設計 | `rag-engineer` | sickn33/awesome | RAGパイプライン設計の決定版 |
| 🎯 プロンプト | `prompt-engineer` | sickn33/awesome | プロンプトエンジニアリング手法体系 |
| 🎯 オーケストレーション | `langgraph` | sickn33/awesome | LangGraphでのエージェント構築 |
| 🔧 キャッシュ | `llm-prompt-caching` | sickn33/awesome | プロンプトキャッシュ・CAGでコスト削減 |
| 🔧 観測 | `langfuse` | sickn33/awesome | LLMオブザーバビリティ（トレース・評価） |

**実行構図**: `prompt-engineer（基盤）→ rag-engineer or langgraph（目的別）→ langfuse（観測）+ llm-prompt-caching（最適化）`

---

### TYPE G: 知る・調べる（Research / Analyze）
> 「競合調査」「技術調査」「データ分析」

| 役割 | スキル名 | ソース | 選定理由 |
|------|---------|--------|----------|
| 🎯 リサーチ | `deep-research` | sanjay3290 | Gemini Deep Research Agentを使った自律リサーチ |
| 🎯 ドキュメント | `doc-coauthoring` | sickn33/awesome | 調査結果の構造化ドキュメント化 |
| 🎯 分析 | `analytics-tracking` | coreyhaines31 | データ分析・トラッキング設計 |
| 🔧 競合 | `competitor-alternatives` | coreyhaines31 | 競合比較ページ・分析フレームワーク |

**実行構図**: `deep-research → analytics-tracking（データ裏付け）→ doc-coauthoring（成果物化）`

---

### TYPE H: 伝える・教える（Communicate / Document）
> 「ドキュメント作成」「プレゼン」「ブログ」「研修資料」

| 役割 | スキル名 | ソース | 選定理由 |
|------|---------|--------|----------|
| 🎯 ドキュメント | `doc-coauthoring` | sickn33/awesome | 構造化ドキュメントの共同執筆ワークフロー |
| 🎯 API文書 | `api-documentation-generator` | sickn33/awesome | API仕様書の自動生成 |
| 🎯 プロダクト | `product-manager-toolkit` | sickn33/awesome | PRD・ディスカバリー・GTMテンプレート |
| 🔧 書き方 | `writing-plans` | sickn33/awesome | ライティング計画・構成設計 |

**実行構図**: `writing-plans（構成設計）→ [対象別専門スキル] → doc-coauthoring（仕上げ）`

---

## 4. クロスカッティング・スキル（全TYPE共通で使える）

以下は目的類型に関係なく、品質を底上げするスキル。必要に応じて任意のTYPEに追加する。

| スキル名 | 用途 | いつ追加するか |
|---------|------|---------------|
| `code-review-checklist` | 品質ゲート | コードを書いた後、必ず |
| `lint-and-validate` | 自動検証 | ファイル生成・編集後 |
| `test-driven-development` | テストファースト | 実装フェーズ全般 |
| `systematic-debugging` | デバッグ | エラー発生時 |
| `defense-in-depth` | 多層防御 | セキュリティが関わる場面 |
| `skill-creator` | スキル自作 | 既存スキルでカバーできない場合 |

---

## 5. ツール別のスキル読込パス

| ツール | スキル配置パス | 呼出方法 |
|-------|-------------|---------|
| **Claude Code** | `.claude/skills/` | `>> /skill-name ...` |
| **Claude.ai Projects** | プロジェクトナレッジにSKILL.md添付 | 自然言語で指示 |
| **Cursor** | `.cursor/skills/` | `@skill-name` |
| **Gemini CLI / Antigravity** | `.gemini/skills/` or `~/.gemini/antigravity/skills/` | 自然言語 |
| **Codex CLI** | `.codex/skills/` | 自然言語 |

---

## 6. メタスキル SKILL.md（本構造自体をスキル化）

以下のSKILL.mdを配置すれば、エージェントが自動的にこのルーティングロジックを適用する。

```markdown
---
name: skill-orchestrator
description: >
  プロンプトの本質的目的を分析し、950+スキルから最適な組合せを自動選定する
  メタスキル。任意のプロンプトに対して、目的類型（A-H）を判定し、核スキル
  と補助スキルの実行計画を生成する。すべてのタスクの起点として使用。
---

# Skill Orchestrator

## トリガー
すべてのプロンプトの最初に起動する。

## 処理フロー

### Step 1: 意図解析
プロンプトから以下を抽出せよ:
- **本質的目的 (WHY)**: このプロンプトが存在する根本的理由
- **ゴール状態 (WHAT)**: 完了時に何が存在しているか
- **制約条件 (HOW)**: ツール・言語・期限・フォーマット
- **フェーズ (WHERE)**: 企画 / 設計 / 実装 / 検証 / 運用

### Step 2: 目的類型の判定
以下8パターンのうち該当するものを1-2個選定:

| TYPE | キーワード・シグナル |
|------|---------------------|
| A: Create | 「作る」「新規」「構築」「開発」「立ち上げ」 |
| B: Improve | 「改善」「最適化」「リファクタ」「高速化」「UX」 |
| C: Secure | 「セキュリティ」「脆弱性」「監査」「ハードニング」 |
| D: Ship/Grow | 「ローンチ」「集客」「SEO」「マーケ」「売上」 |
| E: Automate | 「自動化」「CI/CD」「インフラ」「デプロイ」 |
| F: AI-Native | 「RAG」「LLM」「エージェント」「プロンプト」 |
| G: Research | 「調査」「分析」「比較」「レポート」 |
| H: Communicate | 「ドキュメント」「プレゼン」「説明」「研修」 |

### Step 3: スキル選定
該当TYPEの核スキル（🎯）を必ず含め、必要に応じて補助スキル（🔧）と
クロスカッティング・スキルを追加。合計5-7個以内に収める。

### Step 4: 実行計画の出力
以下の形式で出力:

**目的類型**: TYPE X - [名称]
**選定スキル**:
1. `skill-name` - [役割] - [選定理由]
2. ...

**実行構図**:
`skill-A → skill-B + skill-C（並列）→ skill-D`

**各スキルの責務**:
- skill-A: [このスキルが担う具体的な仕事]
- ...
```

---

## 7. 品質ソースの優先順位

スキル選定時、同じ領域に複数候補がある場合の優先順:

1. **Anthropic公式** (`anthropics/skills`) — ドキュメント操作系はこれ一択
2. **Google公式** (`google-gemini/gemini-skills`, `google-labs-code/*`) — Gemini/Stitch連携
3. **主要ベンダー公式** (`vercel-labs`, `supabase`, `openai`) — 各プラットフォーム固有
4. **obra/superpowers** — 開発ワークフロー系の事実上の標準
5. **sickn33/awesome コミュニティ検証済み** — Star 7.9k+、バリデーション済み
6. **その他コミュニティ** — 個別検証が必要

---

## 8. 実践例：プロンプト→スキル選定の具体デモ

### 例1: 「SaaS MVPを作りたい」

**意図解析**:
- WHY: 新規プロダクトで市場検証したい
- WHAT: 動くMVP + ランディングページ
- HOW: Webアプリ（制約未指定）
- WHERE: 企画→設計→実装

**目的類型**: TYPE A (Create) + TYPE D (Ship)

**選定スキル**:
1. `brainstorming` — 🎯 アイデア構造化・機能優先度決定
2. `architecture` — 🎯 技術スタック選定・システム設計
3. `frontend-design` — 🎯 LP＋UIの高品質実装
4. `test-driven-development` — 🔧 テストファースト開発
5. `pricing-strategy` — 🔧 課金モデル設計
6. `page-cro` — 🔧 LP のコンバージョン最適化

**実行構図**: `brainstorming → architecture → frontend-design + test-driven-development（並列）→ pricing-strategy → page-cro`

---

### 例2: 「本番環境のAPIが遅い。原因特定して直したい」

**意図解析**:
- WHY: ユーザー体験の劣化を止めたい
- WHAT: レスポンスタイムが許容範囲内に回復
- HOW: 既存のAPI（制約：本番稼働中）
- WHERE: 検証→実装

**目的類型**: TYPE B (Improve)

**選定スキル**:
1. `systematic-debugging` — 🎯 体系的な問題切り分け
2. `root-cause-tracing` — 🎯 パフォーマンスボトルネックの根本原因特定
3. `web-performance-optimization` — 🎯 具体的な改善パターン適用
4. `postgres-best-practices` — 🔧 DB起因の場合の最適化
5. `lint-and-validate` — 🔧 変更後のバリデーション

**実行構図**: `systematic-debugging → root-cause-tracing → web-performance-optimization or postgres-best-practices（原因別）→ lint-and-validate`

---

### 例3: 「社内LLMチャットボットにRAGを組み込みたい」

**意図解析**:
- WHY: 社内ナレッジへのアクセスを効率化
- WHAT: 社内文書を参照して回答するチャットボット
- HOW: LLM + ベクトルDB + 社内文書
- WHERE: 設計→実装

**目的類型**: TYPE F (AI-Native) + TYPE A (Create)

**選定スキル**:
1. `rag-engineer` — 🎯 RAGパイプライン設計（チャンキング・埋め込み・検索）
2. `prompt-engineer` — 🎯 システムプロンプト設計
3. `architecture` — 🎯 全体アーキテクチャ設計
4. `langfuse` — 🔧 応答品質のトレーシング・評価
5. `llm-prompt-caching` — 🔧 コスト最適化
6. `defense-in-depth` — 🔧 プロンプトインジェクション対策

**実行構図**: `architecture → rag-engineer + prompt-engineer（並列）→ defense-in-depth → langfuse + llm-prompt-caching（並列）`

---

## 9. 運用ルール

1. **最小選定原則**: 常に「必要最小限のスキル」を選ぶ。多ければいいわけではない
2. **公式優先原則**: 同じ領域なら公式ソースのスキルを優先
3. **段階的開示**: 全スキルを一度にロードしない。実行フェーズごとにロード・アンロード
4. **フィードバックループ**: 結果が不十分なら `skill-creator` で不足分を自作
5. **ツール非依存**: この構造はClaude Code / Cursor / Gemini CLI / Claude.ai Projectsのどれでも動作する

---

---

## 10. デプロイ方法

詳細は `DEPLOY-GUIDE.md` を参照。要点:

| ツール | 毎回自動起動？ | 配置先 |
|-------|-------------|-------|
| Claude Code | ◎ ほぼ毎回 | `.claude/skills/skill-orchestrator/SKILL.md` |
| Claude.ai Projects | ◎ 完全に毎回 | プロジェクトナレッジにアップロード |
| Cursor | △ 明示呼出 | `.cursor/skills/` + `.cursorrules`で半自動化可 |
| Gemini CLI / Antigravity | ◎ ほぼ毎回 | `~/.gemini/antigravity/skills/` |

**最も確実に毎回走らせたい場合 → Claude.ai Projects のナレッジに入れる。**

---

## 成果物一覧

| ファイル | 用途 |
|---------|------|
| `skill-orchestrator-architecture.md` | 本ドキュメント（設計全体像） |
| `skill-orchestrator/SKILL.md` | デプロイ可能なメタスキル本体 |
| `DEPLOY-GUIDE.md` | 各ツールへの配置手順 |
| `CROSS-PLATFORM-GUIDE.md` | Claude app × Code × Cursor 統一運用ガイド |

---

*Generated: 2026-02-28 | Source: antigravity-awesome-skills v6.5.0 (950+ skills), anthropics/skills, obra/superpowers, VoltAgent/awesome-agent-skills*
