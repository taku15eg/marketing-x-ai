Publish Gateの最終検証チェックリストを実行してください。

## 自動検証
1. `cd src/dashboard && npm run test` — 全ユニットテストパス
2. `cd src/dashboard && npm run build` — ビルドエラーなし
3. `grep -ri "SEVENDEX" . --include="*.{md,html,txt,json,ts,tsx,js}"` — 0件であること

## セキュリティ確認
4. `.env.local` が `.gitignore` に含まれていること
5. クライアントコードに `ANTHROPIC_API_KEY` が露出していないこと
6. `dangerouslySetInnerHTML` が使われていないこと

## β成功指標チェック
7. URL入力 → 分析 → 結果表示 → 共有URL生成のフローが一貫していること
8. 共有ページにCTA（「自分のLPも分析する」）が存在すること
9. 全出力物にPowered by Publish Gate導線があること

結果を日本語で報告してください。
