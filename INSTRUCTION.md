# INSTRUCTION.md — 自律実行指示書

## やること

Publish GateのPhase 0.5 MVPを構築し、自律テストでリリース品質まで引き上げる。

**読む順序:**
1. `CLAUDE.md` → プロダクト定義・セキュリティ要件
2. この指示書 → 実行手順
3. `TEST-SCENARIOS.json` → テスト用データ
4. `PERSONA-MARKET.md` → 判断に迷った時の参照

---

## Phase A: 構築

### Webダッシュボード（Next.js）

```
src/
├── app/
│   ├── page.tsx              # URL入力（Ahrefs Site Explorer型）
│   ├── analysis/[id]/page.tsx # 結果画面（タブ1のみ活性。他はロック表示）
│   ├── share/[id]/page.tsx   # 共有URL（誰でも閲覧可）
│   └── api/
│       ├── analyze/route.ts      # 分析API
│       ├── ad-creative/route.ts # 広告訴求API（タブ2）
│       └── share/route.ts       # 共有URL生成
├── components/
│   ├── UrlInput.tsx
│   ├── AnalysisResult.tsx
│   ├── IssueCard.tsx         # アコーディオン展開
│   ├── BriefPanel.tsx        # 依頼パック
│   ├── TabNavigation.tsx     # 6タブ（2-6はロック+解放条件）
│   ├── ShareButton.tsx
│   ├── LoadingProgress.tsx   # 4ステップ進捗
│   └── PoweredByBadge.tsx
├── lib/
│   ├── analyzer.ts           # 4ステップパイプライン統合
│   ├── company-research.ts   # Step 1: 企業リサーチ
│   ├── page-reader.ts        # Step 2: DOM+スクショ取得
│   ├── prompt-builder.ts     # Step 3-4: プロンプト構築+Claude API呼出
│   ├── url-validator.ts      # SSRF防御
│   ├── rate-limiter.ts       # レート制限
│   ├── types.ts
│   ├── ad-creative-generator.ts  # タブ2: 広告訴求生成
│   ├── event-logger.ts
│   └── url-cache.ts
└── __tests__/
    ├── security.test.ts
    ├── prompt-builder.test.ts
    ├── analyzer.test.ts
    ├── company-research.test.ts
    ├── page-reader.test.ts
    ├── api-integration.test.ts
    ├── rate-limiter.test.ts
    ├── event-logger.test.ts
    ├── url-cache.test.ts
    ├── ad-creative-generator.test.ts
    └── ad-creative-api.test.ts
```

```
e2e/
├── homepage.spec.ts
├── analysis-flow.spec.ts
├── share.spec.ts
└── api.spec.ts
```

### Chrome拡張（Manifest V3 + Side Panel）

```
extension/
├── manifest.json             # permissions: activeTab, sidePanel のみ
├── content-script.js         # DOM抽出+PIIマスキング
├── service-worker.js         # スクショ撮影+オーケストレーション
├── sidepanel/
│   ├── index.html
│   ├── app.js               # ダッシュボードの簡略版
│   └── styles.css
└── icons/
```

### 実装の優先順位

1. `url-validator.ts`（セキュリティが先）
2. `prompt-builder.ts`（プロダクトの核）
3. `analyzer.ts`（パイプライン統合）
4. UIコンポーネント群
5. 共有URL機能
6. Chrome拡張

---

## Phase B: 自律テスト

### プロンプト品質（TEST-SCENARIOS.json の10シナリオ全て）

各シナリオに対して分析を実行し、7基準で自己採点。80点未満はプロンプト修正→再テスト（最大3回）。

| 基準 | 配点 | 最低点 |
|------|------|--------|
| 企業理解の具体性 | 15 | 12 |
| ページ読み取りの正確性 | 20 | 16 |
| 課題のインパクト順序 | 15 | 12 |
| ブリーフの行動可能性 | 20 | 16 |
| 根拠チェーン | 10 | 8 |
| 薬機法検知（該当時） | 10 | 8 |
| JSON構造の正確性 | 10 | 10 |

### セキュリティテスト（全PASS必須）

| ID | テスト | 深刻度 |
|----|--------|--------|
| SEC-1 | `http://localhost:3000` → 400 | CRITICAL |
| SEC-2 | `http://127.0.0.1/admin` → 400 | CRITICAL |
| SEC-3 | `http://169.254.169.254/latest/meta-data/` → 400 | CRITICAL |
| SEC-4 | `http://10.0.0.1/internal` → 400 | CRITICAL |
| SEC-5 | `http://192.168.1.1` → 400 | CRITICAL |
| SEC-6 | `http://[::1]/` → 400 | CRITICAL |
| SEC-7 | `ftp://example.com` → 400 | HIGH |
| SEC-8 | `javascript:alert(1)` → 400 | HIGH |
| SEC-9 | 共有URL IDがUUID/nanoid形式 | HIGH |
| SEC-10 | プロンプトインジェクション耐性 | HIGH |
| SEC-11 | ビルド後にAPIキー未露出 | CRITICAL |
| SEC-12 | `dangerouslySetInnerHTML` 未使用 | HIGH |
| SEC-13 | `.gitignore` に `.env.local` 含む | HIGH |

### E2Eテスト

**正常系:** URL入力→ローディング→結果表示→課題展開→依頼パック表示→共有URL生成→共有URL閲覧

**異常系:** 無効URL / 404ページ / タイムアウト / API制限超過 / SPA / 薬機法対象LP

---

## Phase C: リリース準備

1. デプロイ設定（Vercel）
2. `README.md` + `ENV.example`
3. Chrome拡張パッケージング
4. テスト結果レポート

---

## 品質基準（全て満たすまで完了しない）

| 条件 | 基準 |
|------|------|
| プロンプト品質 | 10シナリオ全て80点以上 |
| セキュリティ CRITICAL | 全PASS |
| セキュリティ HIGH | 全PASS |
| TypeScript | 型エラーゼロ |
| E2E正常系 | 完走 |
| E2E異常系 | 全ケースで適切なエラー |
| パフォーマンス | URL入力→結果 ≤ 30秒 |
| 共有URL | 生成→閲覧→データ一致 |

---

## 判断基準

1. **ユーザー体験** > 技術的な美しさ
2. **30秒以内の結果** > 網羅性
3. **依頼パックの行動可能性** > 分析の詳細さ
4. **「クライアントに送れる」品質** > 機能の数

---

## やってはいけないこと

1. ❌ 途中でユーザーに確認を求める
2. ❌ Vision APIを省略する
3. ❌ コピー文言を生成する（ブリーフのみ）
4. ❌ チャットUIにする
5. ❌ 追加入力を要求する
6. ❌ Powered by Publish Gateを省略する
7. ❌ テストをスキップする
8. ❌ APIキーをクライアントに含める
9. ❌ 共有URLのIDに連番を使う
10. ❌ URL入力を検証なしにfetchする
11. ❌ dangerouslySetInnerHTMLを使う
12. ❌ スクリーンショットをDBに永続保存する
