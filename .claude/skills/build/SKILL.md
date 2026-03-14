---
name: build
description: >
  プロジェクトのビルドを実行する。Dashboard（Next.js）のビルドと
  Chrome拡張のパッケージング。$ARGUMENTSで対象を指定可能。
  Use when: ビルド、パッケージング、デプロイ前確認。
---

# Build

## 引数

- `(なし)` or `all`: Dashboard + Chrome拡張
- `dashboard`: Dashboardのみ
- `extension`: Chrome拡張のみ

## 手順

### Dashboard
```bash
cd src/dashboard
npm run build
```

ビルドエラーが出た場合:
1. TypeScript型エラーを修正
2. ESLintエラーを修正（`npm run lint`）
3. 再ビルド

### Chrome拡張
```bash
# Manifest V3のバリデーション
cd src/extension
cat manifest.json | python3 -c "import sys,json; json.load(sys.stdin); print('Valid JSON')"
```

確認事項:
- manifest.json が有効なJSON
- permissions が `activeTab`, `sidePanel` のみ
- アイコンファイル（16/48/128px）が存在
- content_security_policy が適切

### ビルド後チェック
- `NEXT_PUBLIC_` 以外の環境変数がビルド成果物に含まれていないか確認
- バンドルサイズの確認
