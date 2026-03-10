# Cross-Platform運用ガイド
## Claude app × Claude Code × Cursor で Skill Orchestrator を統一運用する

---

## 現実の制約（正直に）

```
Claude.ai (Web/App)     Claude Code (CLI)     Cursor / IDE
     │                       │                     │
     │  Projects +            │  CLAUDE.md +        │  .cursor/skills +
     │  ナレッジ +            │  .claude/skills +   │  .cursorrules
     │  メモリ               │  auto memory        │
     │                       │                     │
     └───── 完全に独立 ──────┴───── 完全に独立 ─────┘
              ↑                    ↑
           会話履歴の横断共有は不可能
```

**事実**: 3ツールは独立したセッション管理。ネイティブで会話を引き継ぐAPIは存在しない。

---

## ベストプラクティス：「Single Source of Truth」パターン

会話履歴は共有できないが、**知識・ルール・スキル**は共有できる。
方法は「1つのMarkdownファイルを真実の源泉として全ツールに配る」こと。

```
┌──────────────────────────────────────────┐
│     skill-orchestrator.md                │
│     （Single Source of Truth）            │
│                                          │
│  ・Skill Orchestrator 本体               │
│  ・あなたの作業ルール・好み              │
│  ・プロジェクト固有のコンテキスト         │
└──────┬──────────┬──────────┬─────────────┘
       │          │          │
       ▼          ▼          ▼
  Claude.ai   Claude Code   Cursor
  Projects    CLAUDE.md     .cursorrules
  ナレッジ    + skills/     + skills/
```

### 具体的なセットアップ

---

### ① Claude.ai Projects（Webアプリ）

**手動セットアップが必要（私からはできない）**

1. claude.ai → 左サイドバー → 「Projects」 → 新規作成 or 既存を開く
2. プロジェクト設定画面（⚙️アイコン）→ 「Knowledge」
3. ダウンロードした `skill-orchestrator/SKILL.md` をドラッグ&ドロップ
4. 「Project Instructions」に以下を貼り付け:

```
すべてのプロンプトに対して、まずSkill Orchestratorの
意図解析（PHASE 1-4）を実行し、選定スキルと実行構図を
明示してから作業に入ること。日本語で応答。結論ファースト。
```

**結果**: このプロジェクト内の全会話で、毎回Orchestratorが起動する。

---

### ② Claude Code（CLI）

```bash
# ── Step 1: グローバルユーザー設定（全プロジェクト共通）──
cat >> ~/.claude/CLAUDE.md << 'EOF'

## Skill Orchestrator
- すべてのタスクで、まず意図解析（WHY/WHAT/HOW/WHERE）を行う
- 目的類型（A-H）を判定し、最適なスキル群を選定してから実行に入る
- 日本語で応答。結論ファースト。不確かなことは推測せずツールで確認
- 自律的に問題を完全解決するまで動き続ける
EOF

# ── Step 2: スキルライブラリ本体（プロジェクトごと or グローバル）──
# プロジェクトごとに入れる場合:
git clone https://github.com/sickn33/antigravity-awesome-skills.git .claude/skills/awesome

# グローバルに入れる場合:
git clone https://github.com/sickn33/antigravity-awesome-skills.git ~/.claude/skills/awesome

# ── Step 3: Skill Orchestrator を配置 ──
mkdir -p .claude/skills/skill-orchestrator
# ダウンロードした SKILL.md をここにコピー
cp /path/to/skill-orchestrator/SKILL.md .claude/skills/skill-orchestrator/SKILL.md
```

**結果**: 毎セッション開始時にCLAUDE.md + skills/が自動ロードされる。

---

### ③ Cursor / Windsurf

```bash
# ── Step 1: スキル配置 ──
mkdir -p .cursor/skills/skill-orchestrator
cp /path/to/skill-orchestrator/SKILL.md .cursor/skills/skill-orchestrator/SKILL.md

# ── Step 2: .cursorrules に追記 ──
cat >> .cursorrules << 'EOF'

## Core Rules
- For every task, first consult @skill-orchestrator to determine the
  optimal skill combination before proceeding.
- 日本語で応答。結論ファースト。
- 自律的に問題を完全解決するまで動き続ける。
EOF
```

**結果**: `@skill-orchestrator` で明示呼出。`.cursorrules`の記述により半自動化。

---

## 会話履歴の「横断引き継ぎ」— 現実的な代替案

ネイティブ共有は不可能だが、以下3つのパターンで実質的に引き継げる。

### パターン1: 手動コンテキスト転送（最もシンプル）

```
Claude.ai で会話 → 重要な結論をコピー → Claude Code に貼り付けて開始
```

**やり方**:
- Claude.aiでの会話の最後に「この会話の重要な決定事項と未解決事項をまとめて」と依頼
- 出力されたサマリーを、Claude Codeの最初のプロンプトに貼る

**メリット**: 確実。余計なツール不要。
**デメリット**: 手動。毎回やる必要がある。

---

### パターン2: CLAUDE.md / MEMORY.md に蓄積（推奨）

Claude Codeは自動的にMEMORY.mdに学習結果を蓄積する。
これを意識的に活用する。

```bash
# Claude Code内で:
>> この会話で決まったことをメモリに保存して

# または直接:
>> remember that we decided to use Supabase for auth, not Firebase
```

**Claude.ai側**: 同等の情報を Projects のナレッジに追記。
→ 両方に同じ知識が入るので、**実質的に文脈が共有される**。

```
Claude.ai Projects ナレッジ     Claude Code MEMORY.md
┌─────────────────────────┐    ┌──────────────────────────┐
│ - 認証はSupabase         │    │ - 認証はSupabase          │
│ - DBはPostgreSQL         │ ≒  │ - DBはPostgreSQL          │
│ - UIはshadcn/ui          │    │ - UIはshadcn/ui           │
└─────────────────────────┘    └──────────────────────────┘
     手動で同期                     自動蓄積 + 手動追記
```

---

### パターン3: コンテキストファイル方式（チーム向け・最も堅牢）

プロジェクトルートに `CONTEXT.md` を置き、全ツールから参照する。

```bash
# プロジェクトルートに作成
touch CONTEXT.md
```

```markdown
# Project Context — 全ツール共有

## 決定事項
- 2026-02-28: 認証はSupabase Auth。Firebase は検討の結果却下（コスト理由）
- 2026-02-28: フロントエンドは Next.js 15 + shadcn/ui

## 未解決事項
- デプロイ先未定（Vercel vs Cloudflare Workers）
- 課金モデル未定（フリーミアム vs 有料のみ）

## アーキテクチャ概要
[ここに図や説明]
```

**各ツールからの参照方法**:
- **Claude Code**: CLAUDE.md に `See @CONTEXT.md for project decisions` と記載
- **Claude.ai**: CONTEXT.md をナレッジにアップロード（更新時は再アップ）
- **Cursor**: `.cursorrules` に `Always read CONTEXT.md before starting work` と記載

**メリット**: Gitで管理できる。チームで共有できる。全ツールで同じ情報。
**デメリット**: 更新は手動。Claude.aiへの再アップロードが必要。

---

## 推奨: 3段階セットアップ

### まず今日やること（5分）

1. ダウンロードした `SKILL.md` を Claude.ai Projects のナレッジに入れる
2. Projects Instructions に「Skill Orchestratorを毎回実行」と書く
3. → **これだけで Claude.ai での運用は即開始**

### 次にやること（Claude Code使用時）

4. `~/.claude/CLAUDE.md` にグローバルルールを追記
5. `.claude/skills/skill-orchestrator/SKILL.md` を配置
6. antigravity-awesome-skills をクローン

### 継続的にやること

7. 重要な決定はCONTEXT.mdに記録
8. CONTEXT.mdをClaude.aiナレッジにも同期
9. → 実質的な「会話履歴の横断引き継ぎ」が成立

---

## まとめ

| 目標 | 実現方法 | 手間 |
|------|---------|------|
| Orchestratorを毎回走らせる | Projects ナレッジ + CLAUDE.md | 初回のみ |
| 全ツールで同じスキルを使う | SKILL.mdを各ツールのパスに配置 | 初回のみ |
| 会話履歴を引き継ぐ | CONTEXT.md + MEMORY.md 手動同期 | 継続的（軽微） |
| 知識・ルールを共有 | Single Source of Truth パターン | 更新時のみ |

**完全自動の会話共有は現時点で不可能だが、「知識の共有」は仕組みで解決できる。**
会話は消えても、知識は残る。それがCLAUDE.md / Projects / CONTEXT.mdの役割。
