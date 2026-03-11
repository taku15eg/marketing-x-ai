---
name: skill-orchestrator
description: >
  全プロンプトの起点として意図を解析し、最適なスキル組合せと実行順序を決定する
  メタスキル。Use when: any task, project kickoff, planning, skill selection,
  workflow design, multi-step implementation.
---

# Skill Orchestrator — 意図解析＆自動ルーティング

> **NOTE**: スキルはAnthropicガイド準拠で `.claude/skills/` に配置済み。
> このファイルはルートからのエントリポイント。

## スキル一覧

### プロジェクト固有スキル（`.claude/skills/`）

| スキル | 用途 |
|--------|------|
| [`skill-orchestrator`](.claude/skills/skill-orchestrator/SKILL.md) | 意図解析＆自動ルーティング（このファイルの詳細版） |
| [`lp-analysis`](.claude/skills/lp-analysis/SKILL.md) | LP分析4ステップパイプライン |
| [`share-url-debug`](.claude/skills/share-url-debug/SKILL.md) | 共有URL・バイラルループ |
| [`security-audit`](.claude/skills/security-audit/SKILL.md) | SSRF防御・セキュリティ監査 |
| [`test-and-build`](.claude/skills/test-and-build/SKILL.md) | テスト実行・ビルド検証 |
| [`deploy-guide`](.claude/skills/deploy-guide/SKILL.md) | 環境構築・デプロイ手順 |
| [`chrome-extension`](.claude/skills/chrome-extension/SKILL.md) | Chrome拡張開発 |

### カスタムコマンド（`.claude/commands/`）

| コマンド | 用途 |
|---------|------|
| `/test` | テスト＆ビルド実行 |
| `/verify` | 最終検証チェックリスト |
| `/security` | セキュリティ監査 |

---

## 意図解析（MANDATORY）

プロンプトを受け取ったら以下4要素を内部で特定:

1. **WHY** — 本質的目的
2. **WHAT** — ゴール状態
3. **HOW** — 制約条件
4. **WHERE** — 企画 / 設計 / 実装 / 検証 / 運用

## 目的類型

| TYPE | 名称 | シグナル |
|------|------|---------|
| A | Create | 作る / 新規 / 構築 / build / create |
| B | Improve | 改善 / リファクタ / fix / optimize |
| C | Secure | セキュリティ / 脆弱性 / audit |
| D | Ship / Grow | ローンチ / デプロイ / growth |
| E | Test / Verify | テスト / 検証 / verify |
| F | Research | 調査 / 分析 / research |

## 選定基準

1. **合計3-5個以内**に絞る
2. `.claude/skills/` 内のプロジェクト固有スキルを最優先
3. 同一領域の重複は排除
4. 計画出力後、確認を待たず実行に移行

## 汎用スキルパターン参照

TYPE A-Hの詳細な実行構図は `.claude/skills/skill-orchestrator/SKILL.md` を参照。

## 運用原則

- **最小選定**: 効くスキルだけ選ぶ
- **段階的開示**: 必要なスキルだけロード
- **プロジェクト固有優先**: `.claude/skills/` 内を外部より優先
- **自律実行**: 計画を出したら確認を待たず実行に移る
