# Skill Orchestrator — デプロイガイド

## 前提: スキルライブラリ本体のインストール

Skill Orchestratorは「ルーター」であり、ルーティング先のスキル本体が必要。
以下でantigravity-awesome-skillsをインストール済みであること:

```bash
# 推奨: 一括インストール
npx antigravity-awesome-skills

# または git clone（ツール別パスは下記参照）
```

---

## 1. Claude Code（CLI）— 最も推奨

```bash
# Step 1: スキルライブラリ本体
git clone https://github.com/sickn33/antigravity-awesome-skills.git .claude/skills/awesome

# Step 2: Skill Orchestrator を配置
mkdir -p .claude/skills/skill-orchestrator
cp SKILL.md .claude/skills/skill-orchestrator/SKILL.md
```

**動作確認**:
```
>> 新しいSaaSのMVPを作りたい
# → Orchestratorが起動し、TYPE A (Create) のスキル群が選定される
```

**自動起動の仕組み**: Claude Codeは `.claude/skills/` 配下の全SKILL.mdの
descriptionをスキャン（~100トークン/スキル）。本スキルのdescriptionに
「ALWAYS activate」「any task, any prompt」と記載してあるため、
事実上すべてのプロンプトで関連性ありと判定→フルロードされる。

---

## 2. Claude.ai Projects — 確実に毎回起動

1. claude.ai でプロジェクトを作成（または既存プロジェクトを開く）
2. プロジェクト設定 → 「ナレッジ」 → SKILL.md をアップロード
3. 以降、そのプロジェクト内の全会話でOrchestrator が常にコンテキストに入る

**ポイント**: Projects のナレッジは全会話に注入されるため、
「毎回走るか？」→ **100% Yes**。最も確実な方法。

**Project Instructions に追記推奨**:
```
すべてのプロンプトに対して、まずSkill Orchestratorの意図解析（PHASE 1-4）を
実行し、選定スキルと実行構図を明示してから作業に入ること。
```

---

## 3. Cursor / Windsurf

```bash
# Step 1: スキルライブラリ本体
git clone https://github.com/sickn33/antigravity-awesome-skills.git .cursor/skills/awesome

# Step 2: Skill Orchestrator を配置
mkdir -p .cursor/skills/skill-orchestrator
cp SKILL.md .cursor/skills/skill-orchestrator/SKILL.md
```

**呼出方法**: Cursorではチャット内で `@skill-orchestrator` と明示的に呼ぶ。
自動起動ではないが、一度呼べばその会話内で継続的に機能する。

**Tips**: `.cursorrules` に以下を追記すると半自動化できる:
```
For every task, first consult @skill-orchestrator to determine the optimal
skill combination before proceeding with implementation.
```

---

## 4. Gemini CLI / Antigravity IDE

```bash
# Step 1: スキルライブラリ本体（Antigravityデフォルトパス）
npx antigravity-awesome-skills --antigravity
# → ~/.gemini/antigravity/skills/ に配置

# Step 2: Skill Orchestrator を配置
mkdir -p ~/.gemini/antigravity/skills/skill-orchestrator
cp SKILL.md ~/.gemini/antigravity/skills/skill-orchestrator/SKILL.md
```

**動作**: Claude Codeと同じ段階的開示アーキテクチャ。
descriptionのキーワードマッチで自動起動。

---

## 5. Codex CLI（OpenAI）

```bash
mkdir -p .codex/skills/skill-orchestrator
cp SKILL.md .codex/skills/skill-orchestrator/SKILL.md
```

---

## ディレクトリ構造（最終形）

```
.claude/skills/          # or .cursor/skills/ or .gemini/skills/
├── skill-orchestrator/
│   └── SKILL.md         ← このファイル（ルーター）
└── awesome/             ← antigravity-awesome-skills clone
    └── skills/
        ├── brainstorming/
        │   └── SKILL.md
        ├── architecture/
        │   └── SKILL.md
        ├── rag-engineer/
        │   └── SKILL.md
        └── ... (713+ skills)
```

---

## トラブルシューティング

**Q: Orchestratorが起動しない**
→ SKILL.md の `description` にスペルミスがないか確認。
  特に `ALWAYS activate` と `any task, any prompt` が含まれていること。

**Q: 選定されたスキルが見つからない**
→ antigravity-awesome-skills が正しいパスにインストールされているか確認:
  `ls .claude/skills/awesome/skills/ | head -20`

**Q: コンテキストが重くなる**
→ 運用原則の「段階的開示」を徹底。Orchestratorは~3kトークン。
  各スキルのフルロードは~5kトークン/スキル。5-7スキルで最大35k程度。

**Q: 特定領域のスキルを追加したい**
→ `skill-creator` スキルを使って自作し、同じディレクトリに配置。
