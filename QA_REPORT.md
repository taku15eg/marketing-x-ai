# QA_REPORT.md — Publish Gate

**更新日**: 2026-03-14
**Phase**: 0

---

## テスト実行結果

### Unit Tests (vitest)

**実行日**: 2026-03-14
**結果**: ✅ 174/174 パス（994ms）

| テストファイル | テスト数 | 結果 |
|---------------|---------|------|
| security.test.ts | 65 | ✅ パス |
| prompt-builder.test.ts | 20 | ✅ パス |
| company-research.test.ts | 20 | ✅ パス |
| api-integration.test.ts | 17 | ✅ パス |
| page-reader.test.ts | 16 | ✅ パス |
| rate-limiter.test.ts | 14 | ✅ パス |
| event-logger.test.ts | 8 | ✅ パス |
| url-cache.test.ts | 7 | ✅ パス |
| analyzer.test.ts | 7 | ✅ パス |

### TypeScript TypeCheck

**結果**: ✅ エラーなし (`tsc --noEmit`)

### E2E Tests (Playwright)

**結果**: ⚠️ 未実行

テストファイルは存在:
- `e2e/homepage.spec.ts`
- `e2e/analysis-flow.spec.ts`
- `e2e/share.spec.ts`
- `e2e/api.spec.ts`

**ブロッカー**: Playwright未インストール。`npx playwright install` 必要。

### Build

**結果**: 未確認（`.env.local` のANTHROPIC_API_KEY依存の可能性あり）

### Lint

**結果**: 未確認

---

## テストカバレッジ分析

### カバーされている領域

| 領域 | カバレッジ | 備考 |
|------|----------|------|
| SSRF防御 (URL validator) | ✅ 高 | 65テスト。全プライベートIP帯、プロトコル |
| Share ID安全性 | ✅ 良 | nanoid長さ・一意性・エントロピー |
| プロンプトインジェクション防御 | ✅ 良 | XMLタグ・システムプロンプト確認 |
| APIキー隔離 | ✅ 良 | クライアントファイルスキャン |
| XSS防御 | ✅ 良 | dangerouslySetInnerHTML不使用確認 |
| Chrome拡張セキュリティ | ✅ 良 | 権限・API key不在確認 |
| レート制限 | ✅ 良 | 14テスト |
| イベントロガー | ✅ 良 | 8テスト |
| Store (分析・共有) | ✅ 良 | CRUD + TTL |
| URLキャッシュ | ✅ 良 | 正規化・fragment除去 |
| 企業リサーチ | ✅ 良 | HTML抽出ロジック |
| ページリーダー | ✅ 良 | DOM抽出・CTA検出 |
| プロンプトビルダー | ✅ 良 | 構造確認 |
| API統合 | ✅ 良 | エンドポイント動作確認 |

### カバーされていない領域

| 領域 | リスク | 備考 |
|------|--------|------|
| Claude API実呼び出し | HIGH | モック依存。実レスポンスの構造検証なし |
| JSON逸脱時のfallback | HIGH | parseAnalysisResponseのエラーパス |
| Screenshot API連携 | MEDIUM | 外部API依存 |
| 拡張↔Dashboard API連携 | HIGH | 統合テストなし |
| UIコンポーネント単体 | MEDIUM | Reactコンポーネントテストなし |
| ブラウザE2E | HIGH | 全導線の結合テストなし |
| DNS rebinding防御 | MEDIUM | fetchWithSSRFProtectionの実環境テスト |

---

## 既知の問題

| ID | 深刻度 | 内容 | 発見方法 |
|----|--------|------|---------|
| QA-001 | HIGH | 拡張→Dashboard API接続が未検証（スキーマ不一致の可能性） | コードレビュー |
| QA-002 | MEDIUM | プログレス表示がsetTimeoutシミュレーション | コードレビュー |
| QA-003 | MEDIUM | Claude APIレスポンスがJSON以外の場合のfallbackが不十分（throwのみ） | コードレビュー |
| QA-004 | LOW | E2Eテスト未実行 | CI未整備 |
| QA-005 | INFO | インメモリストアの揮発性 | 設計判断 |
