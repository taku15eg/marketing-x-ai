# API Proxy (Cloudflare Workers)

## コマンド
```bash
npx wrangler dev     # ローカル開発
npx wrangler deploy  # デプロイ
```

## 制約（Cloudflare Workers）
- Node.js固有APIは使用不可（fs, path, child_process等）
- Web標準APIのみ使用可（fetch, Request, Response, URL, crypto等）
- メモリ上限: 128MB
- CPU時間上限: 30秒（有料プラン）
- リクエストサイズ上限: 100MB

## ファイル
- `worker.js` — メインのWorkerスクリプト

## セキュリティ
- CORS設定は `lib/cors.ts` のホワイトリストに準拠
- APIキーはCloudflare Workers Secretsで管理（`wrangler secret put`）
- ユーザー入力URLのSSRFチェックを必ず実施
