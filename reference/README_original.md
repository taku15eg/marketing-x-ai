# Publish Gate v2.0

**ページを開くだけで、改善の判断が前に進む。**

Chrome拡張 × AI × GSC/GA4連携。根拠つきの分析・提案・即時反映・ログ蓄積を、ページを開くだけで始められます。

---

## Progressive Value（段階的価値開放）

| Layer | 必要なもの | できること |
|---|---|---|
| **0** | インストールのみ（アカウント不要） | ページ分析＋提案＋即時反映＋依頼パック（5回/日） |
| **1** | アカウント作成（メールのみ） | ログ永続保存＋過去ログによる精度向上（10回/日） |
| **2** | GSC連携 | 流入クエリ・CTR・順位ベースの深い分析 |
| **3** | GA4連携（Pro） | PV・CVR・直帰率分析＋施策結果の自動追跡 |

**Layer 0はアカウント不要。30秒で価値を体験。**

---

## ディレクトリ構成

```
publish-gate-v2/
├── docs/                    # 設計ドキュメント（12本）
│   ├── 01_要件定義書_v2.0.md
│   ├── 02_技術設計書_v2.0.md
│   ├── 03_プロンプト設計書_v2.0.md
│   ├── 04_UX_UIデザイン仕様書_v2.0.md
│   ├── 05_品質_計測_運用設計書_v2.0.md
│   ├── 06_価格プラン設計書_v2.0.md
│   ├── 07_マーケティング戦略書_v2.0.md
│   ├── 08_ロードマップ_v2.0.md
│   ├── 09_β検証計画書_v2.0.md
│   ├── 10_エンジニア向け実装指示書_v2.0.md
│   ├── 11_デザイナー向け実装指示書_v2.0.md
│   └── 12_市場リサーチサマリー_v2.0.md
├── src/                     # Chrome拡張ソースコード
│   ├── manifest.json
│   ├── background/service-worker.js
│   ├── content/content-script.js
│   ├── sidepanel/index.html, styles.css, app.js
│   ├── proxy/worker.js      # Cloudflare Workers APIプロキシ
│   ├── shared/constants.js
│   ├── assets/icon-{16,48,128}.png
│   └── _locales/ja/messages.json
├── web/                     # Webランディングページ（ペライチ）
│   └── index.html
├── mock/                    # UIモック
│   └── sidepanel-mockup-v2.html
├── reference/               # 元資料（v0.x, インタビュー, 戦略分析）
│   ├── 00_戦略分析サマリー_2026-02-28.md
│   ├── 元資料_v0.x/（18本）
│   └── インタビュー/（3本）
├── README.md
├── package.json
└── wrangler.toml
```

---

## v1.0 → v2.0 の主な変更

| 項目 | v1.0 | v2.0 |
|---|---|---|
| 初回体験 | アカウント前提 | **アカウント不要で即座に使える** |
| 入口 | Chrome拡張のみ | **Web1枚（ペライチ）＋Chrome拡張** |
| データ | DOM解析のみ | **DOM＋GSC＋GA4の段階的拡張** |
| ログ保存 | chrome.storage.local | **Supabase（永続）＋ローカル（Layer 0）** |
| 課金モデル | クレジット制 | **価値ベース（分析回数＋データ連携）** |
| 価値の中心 | スキャン→提案 | **ログ蓄積→学習ループ→精度向上** |
| ダッシュボード | なし | **Webダッシュボード（ログ管理・レポート）** |

---

## 開発の始め方

### Chrome拡張（Layer 0）

1. `chrome://extensions` を開く
2. 「デベロッパーモード」をON
3. 「パッケージ化されていない拡張機能を読み込む」→ `src/` フォルダを選択
4. 任意のページを開いてPGアイコンをクリック

### APIプロキシ（Cloudflare Workers）

```bash
cd src/proxy
npx wrangler deploy
npx wrangler secret put ANTHROPIC_API_KEY
```

### Webランディングページ

`web/index.html` を任意のホスティングにデプロイ（Cloudflare Pages, Vercel, etc.）

---

## ライセンス

プロプライエタリ。無断複製・再配布を禁じます。
