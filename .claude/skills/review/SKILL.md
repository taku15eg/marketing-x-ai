---
name: review
description: >
  src/ のコード変更をレビューする。Chrome拡張のManifest V3制約、
  Cloudflare Workers制約、セキュリティ要件（SSRF, XSS, APIキー露出）をチェック。
  Use when: コードレビュー、PR前チェック、品質確認。
---

# Code Review

## 手順

1. `git diff` で変更差分を取得
2. 以下の観点でレビュー:

### セキュリティ
- SSRF: url-validator.ts のバリデーションが適用されているか
- XSS: `dangerouslySetInnerHTML` が使われていないか
- APIキー: `ANTHROPIC_API_KEY` 等がクライアントに露出していないか
- プロンプトインジェクション: ユーザーデータが `<page_content>` で囲まれているか

### プラットフォーム制約
- Chrome拡張: Manifest V3準拠（Service WorkerでDOM操作していないか、permissions最小か）
- Cloudflare Workers: Node.js固有API（fs, path, crypto等）を使っていないか

### コード品質
- TypeScript型エラーがないか
- 不要なconsole.logが残っていないか
- テストが追加/更新されているか

3. 結果を以下の形式で報告:
   - CRITICAL: 修正必須
   - WARNING: 推奨修正
   - INFO: 改善提案

4. CRITICALがあれば修正案を提示
