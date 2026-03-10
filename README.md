# Publish Gate — Claude Code Complete Package

Claude Codeで本プロジェクトを扱うための**完全版**構造化パッケージ。

## クイックスタート

```bash
# 1. 解凍
unzip publish-gate-claude-code-complete.zip
cd publish-gate-claude-code

# 2. Claude Codeでプロジェクトを開く
claude .

# 3. CLAUDE.mdが自動読込される
# プロジェクトコンテキストを理解した状態で作業開始
```

---

## パッケージ内容

| カテゴリ | ファイル数 | 説明 |
|----------|------------|------|
| 設計ドキュメント | 16 | v2.0設計ドキュメント一式 |
| Deep Research | 7 | 市場・競合・製品調査レポート |
| Legacy資料 | 4 | v0.x/v3.0関連資料 |
| ソースコード | 14 | Chrome拡張 + Cloudflare Worker |
| インタビュー原文 | 3 | 3名のインタビュー全文 |
| デモHTML | 19 | v3〜v7の全イテレーション |
| Skill Orchestrator | 5 | 実行ガイド・設計ドキュメント |
| **合計** | **68+** | **完全版パッケージ** |

---

## ディレクトリ構造

```
publish-gate-claude-code/
├── CLAUDE.md                    # 🔴 最重要 — プロジェクトコンテキスト
├── README.md                    # このファイル
├── SKILL.md                     # Skill Orchestrator定義
├── skill-orchestrator-architecture.md
├── EXECUTION-STEPS.md
├── DEPLOY-GUIDE.md
├── CROSS-PLATFORM-GUIDE.md
├── package.json
│
├── docs/                        # 設計ドキュメント
│   ├── 00_project_summary.md    # 全24セッション包括記録
│   ├── 00_strategy_analysis.md  # 戦略分析
│   ├── 01_requirements.md       # 要件定義
│   ├── 02_technical_design.md   # 技術設計
│   ├── 03_prompt_design.md      # プロンプト設計
│   ├── 04_ux_ui_spec.md         # UX/UI仕様
│   ├── 05_quality_ops.md        # 品質・運用
│   ├── 06_pricing.md            # 価格プラン
│   ├── 07_marketing.md          # マーケティング
│   ├── 08_roadmap.md            # ロードマップ
│   ├── 09_beta_plan.md          # β検証計画
│   ├── 10_engineer_guide.md     # エンジニア向け
│   ├── 11_designer_guide.md     # デザイナー向け
│   ├── 12_market_research.md    # 市場リサーチ
│   ├── 13_customer_journey.md   # カスタマージャーニー
│   ├── 14_zero_base_redesign.md # ゼロベース再設計
│   │
│   ├── research/                # Deep Researchレポート
│   │   ├── deep_research_market.md
│   │   ├── deep_research_product.md
│   │   ├── deep_research_product_revised.md
│   │   ├── market_competitive_design.md
│   │   ├── mvp_roadmap.md
│   │   ├── product_deep_dive.md
│   │   └── roadmap_v0.5.md
│   │
│   └── legacy/                  # v0.x/v3.0資料
│       ├── phase0_test_guide.txt
│       ├── requirements_v3.txt
│       ├── zero_base_redesign.txt
│       └── all_sessions.txt
│
├── src/
│   ├── extension/               # Chrome拡張（14ファイル）
│   │   ├── manifest.json
│   │   ├── constants.js
│   │   ├── background/service-worker.js
│   │   ├── content/content-script.js
│   │   ├── sidepanel/index.html
│   │   ├── sidepanel/app.js
│   │   ├── sidepanel/styles.css
│   │   ├── _locales/ja/messages.json
│   │   └── assets/icon{16,48,128}.png
│   │
│   └── proxy/
│       └── worker.js            # Cloudflare Worker
│
├── context/
│   └── interviews/              # インタビュー原文
│       ├── marketing_lead_shichijo.txt  # 七條型（63KB）
│       ├── navicle_marketing.txt        # 浦田型（26KB）
│       └── freelance_marketing.txt      # 藤野型（31KB）
│
├── demo/                        # デモHTML（19ファイル）
│   ├── publish-gate-v7-lp-demo-prototype_2.html  # 🔴 最新版
│   ├── publish-gate-v6-lp-demo*.html
│   ├── publish-gate-v6-demo*.html
│   ├── publish-gate-v5-demo*.html
│   ├── publish-gate-v4-demo*.html
│   ├── publish-gate-v3_*.html
│   ├── sidepanel-mockup-v2.html
│   ├── sidepanel-mockup-v3.html
│   ├── landing-page.html
│   └── web-landing-v2.html
│
└── reference/
    ├── README_original.md
    └── README_v3.md
```

---

## 使い方

### 1. 新機能追加時
```
@docs/01_requirements.md を参照して、Layer 0の体験を崩さないか確認
```

### 2. UIデザイン変更時
```
@docs/04_ux_ui_spec.md を参照して、360px制約を満たすか確認
```

### 3. プロンプト調整時
```
@docs/03_prompt_design.md を参照して、FVテキスト抽出仕様を確認
```

### 4. 判断に迷ったら
```
@docs/14_zero_base_redesign.md を参照して、設計根拠を確認
```

### 5. ユーザーの声を確認
```
@context/interviews/ を参照して、インタビュー原文を確認
```

---

## コア設計原則

1. **Progressive Value**: Layer 0だけで価値を感じられる設計
2. **アップサイドフレーミング**: PASS/FAILではなく改善ポテンシャル
3. **360px最適化**: Side Panelの幅制約
4. **ハンドオフパックの質**: 最も価値が高い出力物
5. **ラボノート形式**: Before/After+結果の実験記録

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Chrome拡張 | Manifest V3 / Side Panel API |
| APIプロキシ | Cloudflare Workers |
| バックエンド | Supabase (PostgreSQL + Auth) |
| AI | Claude API (Anthropic) |

---

## 現在のステータス

- **LP+デモHTML**: v8-enriched版仮確定済み
- **Chrome拡張プロトタイプ**: v0.1構築済み（モックモード）
- **次ステップ**: 実機テスト → Claude API接続 → プロジェクトドキュメント更新

---

## 連絡先

- **開発元**: Hashigaya Takuya
- **プロジェクト開始**: 2026-02-27
- **現在のバージョン**: v2.0

---

*Last Updated: 2026-03-05*
