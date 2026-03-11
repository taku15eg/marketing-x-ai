---
name: chrome-extension
description: >
  Publish GateのChrome拡張（Manifest V3 + Side Panel API）の開発・デバッグ。
  Use when: Chrome拡張の修正, Side Panelの問題, content-scriptの変更,
  manifest.jsonの更新, 'extension', '拡張', 'Side Panel'。
---

# Chrome Extension — Manifest V3 + Side Panel

## 構造

```
src/extension/
├── manifest.json          — 権限定義（最小権限）
├── constants.js           — 定数
├── background/
│   └── service-worker.js  — 拡張ライフサイクル・タブ通信
├── content/
│   └── content-script.js  — PII マスキング・DOM監視
├── sidepanel/
│   ├── index.html         — Side Panel UI
│   ├── app.js             — Side Panel ロジック（4画面: 入力/進捗/結果/エラー）
│   └── styles.css         — 360px幅レスポンシブ
├── _locales/ja/
│   └── messages.json      — 日本語ローカライズ
└── assets/                — アイコン（16/48/128px）
```

## 権限ルール（CRITICAL）

最小権限を厳守:
- `permissions`: `activeTab`, `sidePanel` のみ
- content-scriptは `chrome.scripting.executeScript` でオンデマンド注入
- **追加の権限は絶対に付与しない**

## PII保護

content-script でマスキング対象:
- メールアドレス
- 電話番号
- 郵便番号

## Webダッシュボードとの連携

Side PanelはWebダッシュボードと同じAPIを叩く:
- `POST /api/analyze` — 分析実行
- `POST /api/share` — 共有URL生成
- `GET /api/analyze?id=` — 結果取得

## デバッグ手順

1. `chrome://extensions` でデベロッパーモードON
2. 「パッケージ化されていない拡張機能を読み込む」→ `src/extension/`
3. 変更後は「更新」ボタンをクリック
4. Side Panelは右クリックメニューから開く
5. デバッグ: Side Panel上で右クリック→「検証」
