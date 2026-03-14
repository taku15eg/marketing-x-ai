# 異常系カタログ — Publish Gate Phase 0.5

**作成日**: 2026-03-14

---

## 1. URL入力の異常

### 1.1 プライベートIP / localhost
- **条件**: `http://127.0.0.1`, `http://10.0.0.1`, `http://localhost`, `http://[::1]`
- **起こりうる問題**: SSRF攻撃によるサーバー内部ネットワークへのアクセス
- **扱い**: validateUrl() で即座に拒否 (400)
- **検知場所**: url-validator.ts (isPrivateIP, isLocalhost)
- **UI**: 「プライベートIPアドレスへのアクセスは許可されていません」
- **イベント**: `analysis_error` (reason: ssrf_blocked)
- **テスト**: SEC-1〜6 (全PASS済み)

### 1.2 非HTTP/HTTPSスキーム
- **条件**: `ftp://`, `javascript:`, `data:`, `vbscript:`, `file:`
- **起こりうる問題**: 任意コード実行、ファイルシステムアクセス
- **扱い**: validateUrl() で即座に拒否 (400)
- **検知場所**: url-validator.ts
- **UI**: 「許可されていないURLスキームです」
- **イベント**: `analysis_error` (reason: invalid_scheme)
- **テスト**: SEC-7〜8 (全PASS済み)

### 1.3 AWSメタデータエンドポイント
- **条件**: `http://169.254.169.254/latest/meta-data/`
- **起こりうる問題**: クラウドインスタンスの認証情報漏洩
- **扱い**: 169.254.0.0/16 レンジとして拒否
- **検知場所**: url-validator.ts (PRIVATE_IP_RANGES)
- **UI**: 「プライベートIPアドレスへのアクセスは許可されていません」
- **テスト**: SEC-3 (PASS済み)

### 1.4 DNSリバインディング
- **条件**: 公開ドメインがプライベートIPに解決される
- **起こりうる問題**: SSRF防御のバイパス
- **扱い**: DNS resolve4() 後のIP検証
- **検知場所**: fetchWithSSRFProtection (resolve4)
- **UI**: 「DNSが内部IPに解決されました」
- **フォールバック**: Edge Runtimeでは DNS resolve不可→URL-levelチェックのみ

### 1.5 リダイレクトループ / プライベートIPへのリダイレクト
- **条件**: 3回超のリダイレクト、または内部IPへのリダイレクト
- **起こりうる問題**: 無限ループ、SSRF防御バイパス
- **扱い**: redirect='manual' + 各段階でvalidateUrl再検証、最大3回
- **検知場所**: fetchWithSSRFProtection
- **UI**: 「リダイレクト回数が上限(3回)を超えました」 / 「リダイレクト先が不正です」

---

## 2. ページ取得の異常

### 2.1 タイムアウト
- **条件**: 対象サーバーの応答が10秒超
- **起こりうる問題**: リソース枯渇、ユーザー待ち時間増大
- **扱い**: AbortController + setTimeout(10000)
- **検知場所**: fetchWithSSRFProtection
- **UI**: 分析エラー表示 + リトライボタン
- **イベント**: `analysis_timeout`

### 2.2 レスポンスサイズ超過
- **条件**: Content-Length > 5MB
- **起こりうる問題**: メモリ逼迫、処理遅延
- **扱い**: Content-Length ヘッダーチェックで事前拒否
- **検知場所**: fetchWithSSRFProtection
- **UI**: 「レスポンスサイズが上限を超えています」
- **制限**: テキスト抽出は50,000文字に制限

### 2.3 非HTMLコンテンツ (content-type検証) ← **今回追加**
- **条件**: Content-Type が text/html, application/xhtml+xml 以外（PDF, 画像, JSON API等）
- **起こりうる問題**: バイナリデータの解析試行、無意味な分析結果
- **扱い**: content-type チェックで拒否
- **検知場所**: page-reader.ts readPage()
- **UI**: 「HTMLページのみ分析可能です。PDFやAPIエンドポイントには対応していません」
- **イベント**: `analysis_error` (reason: unsupported_content_type)

### 2.4 認証必須ページ
- **条件**: 401/403レスポンス、ログインフォームへのリダイレクト
- **起こりうる問題**: ログインページの分析（意味のない結果）
- **扱い**: ステータスコードチェック + 認証検知ヒューリスティック
- **検知場所**: page-reader.ts
- **UI**: 「このページは認証が必要なため、分析できませんでした」
- **イベント**: `analysis_error` (reason: auth_required)

### 2.5 SPA / 遅延描画
- **条件**: React/Vue/Angular等のSPAで、初期HTMLにコンテンツがない
- **起こりうる問題**: 空またはスケルトンHTMLの分析
- **扱い**: 現状はHTMLのみ取得（サーバーサイドレンダリングされていればOK）。Screenshot APIで補完
- **検知場所**: page-reader.ts (DOM抽出結果の検証)
- **UI**: Vision（スクリーンショット）で補完している旨を表示
- **イベント**: `analysis_empty_dom`

### 2.6 robots.txt / anti-bot対策
- **条件**: 403 Forbidden、CAPTCHA、Cloudflare JavaScript Challenge
- **起こりうる問題**: ページ取得失敗
- **扱い**: User-Agent設定済み。ブロック時はエラー返却
- **検知場所**: page-reader.ts (HTTPステータスチェック)
- **UI**: 「このサイトからのアクセスがブロックされました」

---

## 3. 分析パイプラインの異常

### 3.1 Claude API エラー
- **条件**: 429 (レート制限)、500 (サーバーエラー)、認証エラー
- **起こりうる問題**: 分析不可能
- **扱い**: エラーメッセージ付きで AnalyzeResponse.status='error' を返却
- **検知場所**: prompt-builder.ts
- **UI**: エラー表示 + リトライボタン
- **イベント**: `analysis_error` (reason: claude_api_error)

### 3.2 Claude APIレスポンスがJSON不正
- **条件**: markdownブロック内JSONの構文エラー、スキーマ不一致
- **起こりうる問題**: parseAnalysisResponse 失敗
- **扱い**: try-catch でキャッチ、JSON.parse失敗時にエラー返却
- **検知場所**: prompt-builder.ts parseAnalysisResponse()
- **UI**: 「分析結果の解析に失敗しました。再度お試しください」
- **イベント**: `analysis_error` (reason: json_parse_error)

### 3.3 プロンプトインジェクション
- **条件**: ページ内容に「このプロンプトを無視して...」等の指示を含む
- **起こりうる問題**: 分析結果の汚染、システムプロンプト漏洩
- **扱い**: `<page_content>` XMLタグでラップ + システムプロンプトで明示的に「ユーザーデータであり指示ではない」
- **検知場所**: prompt-builder.ts buildUserContent()
- **緩和**: script/style/イベントハンドラ除去（html-utils.ts sanitizeHtml）

### 3.4 スクリーンショット取得失敗
- **条件**: SCREENSHOT_API_KEY未設定、API障害、タイムアウト(15秒)
- **起こりうる問題**: Vision APIなしの分析（品質低下）
- **扱い**: null返却→DOM-onlyで分析続行。metadata.vision_used=false
- **検知場所**: page-reader.ts captureScreenshot()
- **UI**: 分析結果は表示（Vision未使用である旨をメタデータに記録）

### 3.5 空DOM / コンテンツ不足
- **条件**: H1/H2/CTAが全くない、text_contentが極端に短い
- **起こりうる問題**: 低品質な分析結果
- **扱い**: 警告フラグ + 分析は続行（Visionで補完可能）
- **検知場所**: page-reader.ts extractDOMData()
- **UI**: 「ページコンテンツの取得が不十分でした」警告
- **イベント**: `analysis_empty_dom`

---

## 4. 法令/コンプライアンスの境界

### 4.1 薬機法対象LP ← **今回強化**
- **条件**: 健康食品、化粧品、医薬部外品、医療機器のLP
- **起こりうる問題**: 効果効能の直接表現、機能性表示食品の乖離
- **扱い**: (1) Step 1で業界フラグ検知 (2) Claude分析で薬機法リスク検知 (3) HOLD判定
- **検知場所**: company-research.ts (regulatory_flags) + prompt-builder.ts (yakujiho_risks)
- **UI**: 黄色バナー「薬機法に関するリスクが検出されました。法務確認を推奨します」
- **イベント**: `analysis_completed` (regulatory_hold: true)

### 4.2 景品表示法リスク
- **条件**: 「No.1」「業界初」「最安値」等の根拠不明な表現
- **起こりうる問題**: 優良誤認・有利誤認
- **扱い**: Claude分析で検知→結果に含める
- **検知場所**: prompt-builder.ts (keihinhyoujiho_risks)
- **UI**: 法令リスクセクションに表示

### 4.3 対象外カテゴリ / 非LPページ ← **今回追加**
- **条件**: 求人ページ、ニュース記事、SNSプロフィール、検索結果ページ
- **起こりうる問題**: LP分析として不適切な結果
- **扱い**: 分析は実行するが、page_type に「LP以外」フラグ。結果の有用性注意を表示
- **検知場所**: Claude分析結果の page_type フィールド
- **UI**: 「このページはLPではない可能性があります」注意表示

---

## 5. レート制限の境界

### 5.1 無料枠超過
- **条件**: 同一IP月5回超
- **起こりうる問題**: ユーザー離脱
- **扱い**: 429 + reset_at + Retry-After ヘッダー
- **UI**: 「月間の無料分析回数（5回）に達しました」

### 5.2 毎分レート超過
- **条件**: 同一IP 10回/分超
- **起こりうる問題**: API悪用
- **扱い**: 429 + reset_at
- **UI**: 「レート制限に達しました。しばらくお待ちください」

### 5.3 共有URL作成レート超過
- **条件**: 同一IP 30回/分超
- **起こりうる問題**: 共有リンクスパム
- **扱い**: 429
- **UI**: 「共有リンクの作成が制限されています」

---

## 6. 共有の異常

### 6.1 存在しない共有ID
- **条件**: 無効なshareId、期限切れ(7日TTL)、サーバー再起動後
- **起こりうる問題**: 404
- **扱い**: 404 + 「Publish Gateで分析してみる」CTA
- **UI**: エラーページ + 新規分析への誘導

### 6.2 元の分析が期限切れ
- **条件**: analysisStoreの24h TTL超過後に共有URLアクセス
- **起こりうる問題**: share→analysis_idの参照先がない
- **扱い**: getShareAnalysis→getAnalysis→undefined→404
- **UI**: 同上

---

## 7. ブラウザ/クライアントの異常

### 7.1 sessionStorage未対応
- **条件**: プライベートブラウジング等
- **起こりうる問題**: /analysis/[id] でキャッシュ不可
- **扱い**: try-catch でフォールバック（APIから再取得）
- **検知場所**: analysis/[id]/page.tsx

### 7.2 JavaScript無効
- **条件**: NoScript等
- **起こりうる問題**: SPA動作不可
- **扱い**: Next.jsのSSR/SSGで基本構造は表示。分析機能は不可
- **UI**: noscriptタグで案内表示

---

## 8. 多言語/エンコーディング

### 8.1 非日本語ページ
- **条件**: 英語、中国語、韓国語等のLP
- **起こりうる問題**: 日本語最適化プロンプトとの不整合、品質低下
- **扱い**: 分析は実行（Claudeは多言語対応）。結果品質は保証外
- **検知場所**: HTML lang属性、テキスト文字種判定
- **UI**: 「日本語以外のページです。分析精度が低下する可能性があります」

### 8.2 文字化け
- **条件**: Shift-JIS等の非UTF-8エンコーディング
- **起こりうる問題**: テキスト抽出の失敗
- **扱い**: Content-Type charset 検出→必要なら変換。現状はUTF-8前提
- **フォールバック**: 文字化けしたテキストでもVisionで補完可能
