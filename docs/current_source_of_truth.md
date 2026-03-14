# 正本定義 — Publish Gate

**更新日**: 2026-03-14

---

## 正本の階層

| 優先度 | 文書 | 役割 |
|--------|------|------|
| 1 (最優先) | `CLAUDE.md` | プロダクト仕様の最上位正本。原則・構造・出力形式・セキュリティ要件 |
| 2 | `src/dashboard/lib/types.ts` | コードレベルの型正本。CLAUDE.mdの出力構造をTypeScript型に |
| 3 | `src/dashboard/app/api/*/route.ts` | API契約の実装正本 |
| 4 | `docs/01_requirements.md` | 要件の詳細展開（CLAUDE.mdと矛盾する場合はCLAUDE.mdが優先） |
| 5 | `docs/02_technical_design.md` | 技術設計の詳細展開 |
| 6 | `docs/03_prompt_design.md` | プロンプト設計の詳細展開 |

---

## 正本間の現行ズレ一覧

### ズレ1: Worker出力スキーマ vs CLAUDE.md出力JSON構造

| 項目 | CLAUDE.md / types.ts | Worker (worker.js) |
|------|---------------------|--------------------|
| 入力 | `{ url }` | `{ page_features, layer, ... }` |
| 企業理解 | `company_understanding` | なし（推定はgoal_card内） |
| ページ読取 | `page_reading` | なし |
| 課題一覧 | `issues[]` with brief | `proposals[]` with target_selector |
| 法規制 | `regulatory` | なし（HOLDで間接表現） |
| 判定 | なし | `judgment: PASS|FAIL|HOLD` |
| 改善度 | `improvement_potential: "+XX%"` | なし |

**判断**: Dashboard API (`types.ts`) が正本。Workerは将来的にproxyまたは廃止。

### ズレ2: 拡張のデータフロー

- **想定**: 拡張 → Dashboard API (`/api/analyze`) → 結果表示
- **実態**: 拡張は `{ url, page_features, screenshot }` を送るが、Dashboard APIは `url` のみ使用
- **影響**: 拡張のDOM抽出とスクリーンショットが無駄になっている

### ズレ3: プログレス表示

- **正本** (`types.ts`): `AnalysisProgress { current_step, step_number, total_steps, message }`
- **Dashboard実装**: `setTimeout`による疑似プログレス（`onProgress`コールバック未使用）
- **影響**: UX上は軽微だが、正確さに欠ける

### ズレ4: CORS設定

- **CLAUDE.md**: 「Phase 1+でdashboard origin + extension IDに制限」
- **実装**: `Access-Control-Allow-Origin: *`
- **判断**: MVP段階では許容。Phase 1で要対応。

---

## 絶対ルールの遵守状態

| ルール | 遵守 | 備考 |
|--------|------|------|
| 1. Vision APIは省略しない | ⚠️ 条件付き | API key設定時のみ動作。未設定時はDOMのみ |
| 2. URL入力だけで全部出る | ✅ | Dashboard APIはURL入力のみ |
| 3. コピー文言は出さない | ✅ | プロンプトで明示的に禁止 |
| 4. 全出力物にPG導線 | ✅ | PoweredByBadge, Share CTA |
| 5. 通知スパム禁止 | ✅ | メール通知未実装 |
| 6. GSC/GA4連携は有料層のみ | ✅ | 未実装（Tab3-4ロック） |
