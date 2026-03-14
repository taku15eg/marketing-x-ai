# QA_REPORT.md — Publish Gate

**更新日**: 2026-03-14
**Phase**: 7

---

## テスト実行結果

### Unit Tests (vitest)

**実行日**: 2026-03-14
**結果**: ✅ 278/278 パス（1.18s）

| テストファイル | テスト数 | 結果 |
|---------------|---------|------|
| security.test.ts | 65 | ✅ パス |
| contract.test.ts | 30 | ✅ パス |
| prompt-builder.test.ts | 28 | ✅ パス |
| flow.test.ts | 26 | ✅ パス |
| page-reader.test.ts | 22 | ✅ パス |
| metrics.test.ts | 18 | ✅ パス |
| company-research.test.ts | 20 | ✅ パス |
| api-integration.test.ts | 17 | ✅ パス |
| pipeline.test.ts | 16 | ✅ パス |
| rate-limiter.test.ts | 14 | ✅ パス |
| event-logger.test.ts | 8 | ✅ パス |
| url-cache.test.ts | 7 | ✅ パス |
| analyzer.test.ts | 7 | ✅ パス |

### TypeScript TypeCheck

**結果**: ✅ エラーなし (`tsc --noEmit`)

### E2E Tests (Playwright)

**結果**: ⚠️ 未実行（ブラウザDL不可環境）

テストファイル:
- `e2e/homepage.spec.ts` — 9テスト（URL入力、バリデーション、ref追跡）
- `e2e/analysis-flow.spec.ts` — 5テスト（ローディング、遷移、エラー、429、リトライ）
- `e2e/share.spec.ts` — 3テスト（無効リンク、CTA表示、共有結果表示）
- `e2e/api.spec.ts` — 9テスト（SSRF防御、CORS、share API）

**ブロッカー**: Playwright chromiumダウンロード不可。CI環境で実行必要。

### Build

**結果**: 未確認（`.env.local` のANTHROPIC_API_KEY依存の可能性あり）

### Lint

**結果**: ✅ エラーなし（`next lint`）

### CI Pipeline

**結果**: ✅ `.github/workflows/ci.yml` 追加

| ジョブ | 内容 | 依存 |
|--------|------|------|
| quality | lint + typecheck + unit tests | — |
| e2e | Playwright E2E tests | quality |

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
| プロンプトビルダー | ✅ 良 | JSON self-heal + fallback |
| API統合 | ✅ 良 | エンドポイント動作確認 |
| パイプライン | ✅ 良 | ステップ順序・設定確認 |
| API契約 | ✅ 良 | リクエスト/レスポンス型検証 |
| フロー（価値導線） | ✅ 良 | URL入力→分析→共有→再閲覧 |
| メトリクス/KPI | ✅ 良 | 全7イベント発火確認、KPI計算、バイラルファネル |

### カバーされていない領域

| 領域 | リスク | 備考 |
|------|--------|------|
| Claude API実呼び出し | HIGH | モック依存。実レスポンスの構造検証なし |
| Screenshot API連携 | MEDIUM | 外部API依存 |
| UIコンポーネント単体 | MEDIUM | Reactコンポーネントテストなし |
| ブラウザE2E | MEDIUM | テスト記述済み、Playwright実行待ち |
| DNS rebinding防御 | MEDIUM | fetchWithSSRFProtectionの実環境テスト |

---

## 既知の問題

| ID | 深刻度 | 内容 | 状態 |
|----|--------|------|------|
| QA-001 | ~~HIGH~~ RESOLVED | 拡張→Dashboard API接続スキーマ不一致 | Phase 1で修正済み |
| QA-002 | LOW | プログレス表示がsetTimeoutシミュレーション | 設計上許容 |
| QA-003 | ~~HIGH~~ RESOLVED | Claude APIレスポンスがJSON以外の場合のfallback不十分 | Phase 2でself-heal実装済み |
| QA-004 | MEDIUM | E2Eテスト未実行 | テスト記述済み、CI環境で実行必要 |
| QA-005 | INFO | インメモリストアの揮発性 | 設計判断（MVP） |

---

## Phase別テスト推移

| Phase | テスト数 | 新規テストファイル |
|-------|---------|-----------------|
| 0 | 174 | 9ファイル（初期） |
| 1 | 204 | contract.test.ts |
| 2 | 212 | pipeline.test.ts 拡張 |
| 3 | 218 | page-reader.test.ts 拡張 |
| 4 | 234 | pipeline.test.ts + prompt-builder.test.ts 拡張 |
| 5 | 260 | flow.test.ts + E2E更新 |
| 6 | 278 | metrics.test.ts + event/metrics API |
| 7 | 278 | CI workflow追加 |
