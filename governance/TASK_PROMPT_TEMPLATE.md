# TASK_PROMPT_TEMPLATE.md — タスク投入テンプレート

> **実装運用ルールの正本**: `governance/CLAUDE_CODE_OPERATING_PROMPT.md`
>
> このファイルはタスク投入時の最小フォーマットのみを定義する。
> 着手前テンプレート（Scope / Assumptions / Decision Required / Validation Plan / Open Questions）の
> 詳細定義・絶対ルール・完了報告の定義は正本を参照すること。

---

## タスク投入フォーマット

```markdown
### Task
- [タスク名 / Backlog ID]

### Goal
- [このタスクで達成すること（1-2文）]

### Constraints
- [スコープ制限・特記事項があれば記述]
- [なければ「なし」]
```

---

## タスクを受け取ったら

1. `governance/CLAUDE_CODE_OPERATING_PROMPT.md` の **Step 1〜3** に従う
2. Step 1 の読み込みリストを全て読む
3. Step 2 の着手前テンプレートを提出する
4. 人間の承認を待ってから実装に入る
