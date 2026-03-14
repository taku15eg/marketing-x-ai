# Chrome拡張 (Manifest V3 + Side Panel API)

## 構成
- `manifest.json` — Manifest V3定義
- `background/service-worker.js` — スクショ撮影 + オーケストレーション
- `content/content-script.js` — DOM抽出 + PIIマスキング
- `sidepanel/` — Side Panel UI（ダッシュボードの簡略版）
- `_locales/ja/` — i18n（日本語）

## 制約（Manifest V3）
- permissions: `activeTab`, `sidePanel` のみ（追加禁止）
- Service WorkerはDOM操作不可（document, windowにアクセスしない）
- 永続的なバックグラウンドプロセス不可
- content-scriptは `chrome.scripting.executeScript` でオンデマンド注入
- `eval()` 使用禁止（CSP制約）

## セキュリティ
- PIIマスキング必須（メール、電話番号、郵便番号）
- スクリーンショット画像はDBに保存しない（分析結果JSONのみ）
- 外部通信はダッシュボードAPIのみ

## 開発
```bash
# chrome://extensions を開く
# 「デベロッパーモード」ON
# 「パッケージ化されていない拡張機能を読み込む」で src/extension/ を選択
# 変更後は拡張機能ページでリロード
```
