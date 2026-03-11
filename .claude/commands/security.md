セキュリティ監査を実行してください。

1. `cd src/dashboard && npx vitest run __tests__/security.test.ts` — セキュリティテスト全パス
2. `src/dashboard/lib/url-validator.ts` を読み、SSRF防御が完全か確認
3. `.env*` ファイルが `.gitignore` に含まれていること
4. `ANTHROPIC_API_KEY` がクライアントコードに露出していないこと（Grep確認）
5. `dangerouslySetInnerHTML` が使われていないこと（Grep確認）
6. プロンプトインジェクション対策（XMLタグ囲み）が実装されていること

結果をCRITICAL/HIGH/MEDIUM/LOWのレベル別に日本語で報告してください。
