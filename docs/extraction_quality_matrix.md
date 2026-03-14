# 抽出品質マトリックス — Publish Gate

**更新日**: 2026-03-14

---

## CTA 抽出カバレッジ

| CTA パターン | 検出方式 | 実装状態 | 備考 |
|-------------|---------|---------|------|
| `<a href>` リンク + CTAテキスト | テキストマッチ | ✅ 実装済み | 日本語+英語キーワード |
| `<a href>` リンク + CTA URL | hrefパターンマッチ | ✅ 実装済み | contact, demo, form等 |
| `<a>` with .btn/.cta class | CSSクラスマッチ | ✅ 実装済み | btn, button, cta |
| `<button>` 要素 | 全button要素 | ✅ 実装済み | テキスト80文字以下 |
| `role="button"` 擬似ボタン | 属性マッチ | ✅ 実装済み | div, span, li対応 |
| `<input type="submit">` | type属性マッチ | ✅ 実装済み | value属性からテキスト |
| `<a><img alt="CTA"></a>` 画像CTA | alt + hrefマッチ | ✅ 実装済み | [画像CTA]プレフィックス |
| 固定CTA (position: fixed/sticky) | CSS解析 | ❌ 未対応 | サーバーサイドHTML解析では困難 |
| JS遷移CTA (onclick, data-href) | イベント属性解析 | ❌ 未対応 | onXXX属性はサニタイズで除去済み |
| SPA内部遷移 (React Router等) | — | ❌ 未対応 | SSR前提のHTML解析 |

### 制限事項

- **固定CTA**: サーバーサイドHTMLfetch時にはレンダリングされないため、CSS `position` の解析不可。Vision APIで補完が必要
- **JS遷移CTA**: セキュリティ上 `onXXX` 属性を除去するため、`onclick="location.href='...'"` は検出不可
- **SPA**: Next.js SSRのページは取得できるが、純粋なSPAは初期HTMLのみ

---

## FV (First View) 抽出

| 要素 | 検出方式 | 実装状態 |
|------|---------|---------|
| H1 テキスト | `<h1>` タグ | ✅ |
| メインコピー | DOM解析 → Claude推定 | ✅ |
| サブコピー | DOM解析 → Claude推定 | ✅ |
| ヒーロー画像 | img alt + 位置推定 | ⚠️ 部分的 |
| 背景画像 | CSS background-image | ❌ 未対応 |

---

## メタ情報抽出

| 要素 | 実装状態 |
|------|---------|
| `<title>` | ✅ |
| `<meta name="description">` | ✅ |
| `<meta property="og:title">` | ✅ |
| `<meta property="og:description">` | ✅ |
| `<meta property="og:image">` | ✅ |
| `<link rel="canonical">` | ✅ |
| 逆順属性 (`content` before `name`) | ✅ |

---

## 位置推定

HTML文字位置比率による推定:

| 比率 | 推定位置 |
|------|---------|
| < 15% | header |
| 15-35% | fv (First View) |
| 35-70% | middle |
| > 70% | footer |

**精度評価**: 一般的なLPでは妥当。ただしナビゲーションが大きいサイトではずれる可能性あり。

---

## Prominence (目立ち度) 推定

| CSSクラスパターン | 推定値 |
|------------------|--------|
| primary, main, hero, cta, btn-lg, btn-primary, btn-cta, submit | primary |
| secondary, outline, ghost, btn-sm, text-link | secondary |
| btn, button | secondary |
| その他 | tertiary |

---

## テストカバレッジ

- `__tests__/page-reader.test.ts`: 22テスト
  - サニタイズパターン検証
  - CTA検出パターン検証
  - メタ情報抽出パターン検証
  - 強化CTA検出（role=button, submit, 画像CTA等）
