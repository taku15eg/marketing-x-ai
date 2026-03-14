---
name: interview-research
description: >
  context/interviews/ のインタビューファイル（120KB+）を読み、
  指定テーマに関する要約を返す。大きなファイルをメインコンテキストに
  読み込まずに処理するためのスキル。
  Use when: インタビューデータの参照、ペルソナ確認、顧客の声の引用。
context: fork
---

# Interview Research

context/interviews/ にある3つのインタビューファイルから、指定されたテーマに関する情報を抽出・要約する。

## 対象ファイル
- `context/interviews/freelance_marketing.txt` (~31KB) — フリーランスマーケター
- `context/interviews/marketing_lead_shichijo.txt` (~63KB) — マーケ責任者
- `context/interviews/navicle_marketing.txt` (~26KB) — 事業会社マーケ

## 手順

1. $ARGUMENTS からテーマを特定（例: 「課題」「ツール利用状況」「価格感」等）
2. 3ファイルを順に読み、テーマに関連する発言を抽出
3. 以下の形式で要約を返す:

```
## テーマ: [指定テーマ]

### 藤野型（フリーランス）
- [関連する発言・インサイト]
- [引用: 「...」]

### 浦田型（事業会社）
- [関連する発言・インサイト]

### 七條型（責任者）
- [関連する発言・インサイト]

### 共通パターン
- [3者に共通する傾向]
```

4. 具体的な発言の引用を必ず含める（「」で囲む）
5. PERSONA-MARKET.md のアーキタイプ分類と照合
