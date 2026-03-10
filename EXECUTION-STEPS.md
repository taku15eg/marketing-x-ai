# 実行手順書
## Skill Orchestrator を全環境にデプロイする

この手順書の通りに上から順にやれば完了します。
所要時間の目安: STEP 1 → 5分 / STEP 2 → 15分 / STEP 3 → 5分

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 1: Claude.ai Projects（ブラウザ or モバイルアプリ）

これが最速で効果が出る。まずここからやる。

### 1-1. プロジェクト作成

1. https://claude.ai を開く
2. 左サイドバー →「Projects」→「Create Project」
3. プロジェクト名: `Skill Orchestrator Hub`（何でもいい）

### 1-2. ナレッジにファイルをアップロード

プロジェクト画面の右側「Knowledge」セクションの「+」ボタンを押して、
以下のファイルをアップロードする:

**必須（1ファイル）:**
- `skill-orchestrator/SKILL.md` ← これがルーティングエンジン本体

**推奨（やるとスキルの中身も参照できるようになる）:**
- `skill-orchestrator-architecture.md` ← 設計全体像と具体例
- `CROSS-PLATFORM-GUIDE.md` ← 運用ルール

### 1-3. Project Instructions を設定

プロジェクト設定画面の「Project Instructions」に以下をそのまま貼る:

```
## 基本ルール
- すべてのプロンプトに対して、まずSkill Orchestratorの意図解析（PHASE 1-4）を実行する
- 目的類型（TYPE A-H）を判定し、選定スキルと実行構図を明示してから作業に入る
- 日本語で応答。結論ファースト
- 不確かなことは推測せずツールで確認する
- 自律的に問題を完全解決するまで動き続ける。途中でユーザーに操作を戻さない

## 出力フォーマット
毎回の応答の冒頭に以下を出力してから本題に入る:
━━━ Skill Orchestrator ━━━
目的類型: TYPE X - [名称]
選定スキル: skill-a, skill-b, skill-c
実行構図: skill-a → skill-b + skill-c（並列）→ skill-d
━━━━━━━━━━━━━━━━━━━━━
```

### 1-4. 動作確認

プロジェクト内で新しい会話を開始し、以下を入力:

```
SaaSのMVPを作りたい
```

→ 冒頭に「━━━ Skill Orchestrator ━━━」のブロックが出れば成功。
→ 出なければ Project Instructions の貼り付けを再確認。

### ここまでの状態
✅ Claude.ai のこのプロジェクト内では毎回Orchestratorが走る
❌ 他のプロジェクトや通常チャットでは走らない（プロジェクト単位の設定のため）
❌ Claude Code / Cursor にはまだ何も入っていない

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 2: Claude Code（CLI）

Claude Codeを使っている/使う予定があるなら必須。
**ここが「設計通りに全部動く」唯一の環境。**

### 2-1. スキルライブラリ本体をクローン

ターミナルで、作業プロジェクトのルートディレクトリに移動してから:

```bash
# スキルライブラリ本体（950+スキル）
git clone https://github.com/sickn33/antigravity-awesome-skills.git .claude/skills/awesome
```

※ 全プロジェクト共通で使いたい場合はグローバルに:
```bash
git clone https://github.com/sickn33/antigravity-awesome-skills.git ~/.claude/skills/awesome
```

### 2-2. Skill Orchestrator を配置

```bash
# ディレクトリ作成
mkdir -p .claude/skills/skill-orchestrator

# ダウンロードした SKILL.md をコピー
# パスはダウンロード先に合わせて変更
cp ~/Downloads/skill-orchestrator/SKILL.md .claude/skills/skill-orchestrator/SKILL.md
```

### 2-3. CLAUDE.md にグローバルルールを追記

```bash
cat >> ~/.claude/CLAUDE.md << 'RULES'

## Skill Orchestrator
- すべてのタスクで、まず意図解析（WHY/WHAT/HOW/WHERE）を行う
- 目的類型（A-H）を判定し、最適なスキル群を選定してから実行に入る
- 日本語で応答。結論ファースト
- 不確かなことは推測せずツールで確認
- 自律的に問題を完全解決するまで動き続ける

## 作業ルール
- コード生成後は必ずレビューチェックを通す
- エラー発生時は systematic-debugging スキルの手順に従う
- 途中でユーザーに操作を戻さない
RULES
```

### 2-4. 動作確認

```bash
claude
# Claude Code を起動して以下を入力:
>> SaaSのMVPを作りたい
```

→ Orchestratorが起動し、awesome/skills/ 内のスキルを読みに行けば成功。

### ここまでの状態
✅ Claude.ai Projects でOrchestratorが動く
✅ Claude Code でOrchestratorが動く + スキル本体も読める
❌ Cursor にはまだ何も入っていない

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 3: Cursor / Windsurf（使っている場合のみ）

### 3-1. スキル配置

```bash
# プロジェクトルートで:
git clone https://github.com/sickn33/antigravity-awesome-skills.git .cursor/skills/awesome

mkdir -p .cursor/skills/skill-orchestrator
cp ~/Downloads/skill-orchestrator/SKILL.md .cursor/skills/skill-orchestrator/SKILL.md
```

### 3-2. .cursorrules に追記

```bash
cat >> .cursorrules << 'RULES'

## Core Behavior
- For every task, first consult @skill-orchestrator to determine
  the optimal skill combination before proceeding.
- 日本語で応答。結論ファースト。
- 自律的に問題を完全解決するまで動き続ける。
- 不確かなことは推測せずツールで確認。
RULES
```

### 3-3. 使い方

Cursorのチャットで `@skill-orchestrator` と書いてから依頼する。
.cursorrules の設定により、書き忘れても半自動で参照される。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 4: 全環境の知識を同期する仕組み（継続運用）

会話履歴はツール間で共有できない。
代わりに「決定事項ファイル」を共有する。

### 4-1. CONTEXT.md を作成

プロジェクトルートに以下を作る:

```bash
cat > CONTEXT.md << 'EOF'
# Project Context — 全ツール共有

## 決定事項
- （ここに重要な決定を追記していく）

## 未解決事項
- （ここに未解決の論点を追記していく）

## 技術スタック
- （決まったら記載）

## 最終更新
- YYYY-MM-DD
EOF
```

### 4-2. 運用ルール

以下を習慣にする:

```
1. 重要な決定をしたら → CONTEXT.md に追記（1行でいい）
2. Claude Code で追記   → 「remember that ...」でMEMORY.mdにも保存
3. Claude.ai を使う時   → CONTEXT.md を更新のたびにナレッジに再アップ
```

これで「会話は消えても、知識は残る」状態になる。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 完了チェックリスト

やった項目にチェックを入れていく:

### STEP 1: Claude.ai Projects
- [ ] プロジェクト作成済み
- [ ] SKILL.md をナレッジにアップロード済み
- [ ] Project Instructions を貼り付け済み
- [ ] 動作確認済み（冒頭にOrchestrator出力が出る）

### STEP 2: Claude Code
- [ ] antigravity-awesome-skills をクローン済み
- [ ] skill-orchestrator/SKILL.md を配置済み
- [ ] ~/.claude/CLAUDE.md にルール追記済み
- [ ] 動作確認済み

### STEP 3: Cursor（使う場合のみ）
- [ ] スキル配置済み
- [ ] .cursorrules 追記済み

### STEP 4: 知識同期
- [ ] CONTEXT.md を作成済み
- [ ] 運用ルールを理解した

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 最低限これだけやれば動く（時間がない場合）

STEP 1 の 1-1 〜 1-4 だけやる。所要5分。
Claude.ai の1プロジェクト内でOrchestratorが毎回走る状態になる。
残りは後日でいい。
