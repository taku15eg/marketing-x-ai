# COMPLETION_REPORT_TEMPLATE.md — 完了報告テンプレート

> 毎Runの完了時に、このテンプレートをコピーして埋め、出力する。

---

```markdown
## Completion Report

### What changed
- [変更したファイルと内容を列挙]

### Why this matters
- [Phase 0.5 成功条件との関係]
- [ユーザーへの影響]

### Validation
- [テスト実行結果]
- [実動作確認結果]
- [セキュリティチェック結果（該当する場合）]

### What I did not change
- [意図的に変更しなかったものとその理由]

### Risks
- [残存リスク]
- [注意が必要な点]

### Suggested next step
- [次にやるべきこと（提案のみ。勝手にやらない）]

### Backlog updates
- [ステータス変更したタスク: B-XXX → DONE]
- [新規発見タスク（追加提案）: 内容 / Phase 0.5成功条件との関係]

### Decision log entries
- [記録した判断: DEC-XXX]
```

---

## 使い方

1. 実装が完了したら上記テンプレートをコピーして埋める
2. `governance/06_REVIEW_CHECKLIST.md` で自己チェックを行う
3. 人間に提出する
4. 人間のレビュー指摘があれば修正し、再提出する
