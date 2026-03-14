# DECISIONS.md — Publish Gate 設計判断ログ

**更新日**: 2026-03-14

---

## DEC-001: 正本（Source of Truth）の定義

**日付**: 2026-03-14
**判断**: CLAUDE.md + Dashboard APIの型定義 (`src/dashboard/lib/types.ts`) を正本とする

**根拠**:
- CLAUDE.md のプロダクト構造・4ステップパイプライン・出力JSON構造が最も包括的かつ最新
- `types.ts` がCLAUDE.mdの出力構造を忠実にTypeScript型として表現している
- Dashboard APIの実装がCLAUDE.mdと整合している
- Worker (`src/proxy/worker.js`) の出力スキーマはCLAUDE.mdと乖離している

**影響**:
- Worker APIの出力スキーマは正本に合わせて更新が必要
- ドキュメント間の矛盾はCLAUDE.md を優先して解消する

---

## DEC-002: 2つのAPIアーキテクチャの整理方針

**日付**: 2026-03-14
**判断**: 保留（Phase 1で決定）

**選択肢**:
1. Dashboard APIに統一し、Workerを廃止
2. Workerを薄いproxy化し、Dashboard APIへ中継
3. 両方維持し、拡張はWorker、DashboardはDashboard APIを使う

**[事実]**:
- Phase 0.5 MVPの定義: Webダッシュボード（タブ1）+ 共有URL + Chrome拡張
- CLAUDE.md: 「Webダッシュボードが本体。Chrome拡張はリテンション」
- 拡張は既にDashboard API (`localhost:3000`) を向いている
- Worker固有機能 (handoff, memo) は今はUI導線がない

**[仮説]**:
- Phase 0.5では選択肢1が最もシンプル
- ただしWorkerのhandoff/memo機能は将来必要になる可能性あり

**次のアクション**: Phase 1で層間契約を定義する際に確定する

---

## DEC-003: インメモリストアの維持判断

**日付**: 2026-03-14
**判断**: β検証中はインメモリで維持する

**根拠**:
- β5名中3名が共有URL生成1回以上が成功指標
- 共有URLの寿命は7日（shareStore TTL）
- β検証期間中にサーバー再起動がなければ問題ない
- Supabase連携は差し替えポイントがコード上に明示されている

**リスク**:
- サーバー再起動で共有リンク切れ → β参加者にネガティブ体験
- 月間レート制限もリセットされる

---

## DEC-004: Vision API省略の暫定許容

**日付**: 2026-03-14
**判断**: SCREENSHOT_API_KEY未設定時のVisionスキップは暫定許容する

**根拠**:
- CLAUDE.md「Vision APIは省略しない」は原則だが、API key未設定は環境依存
- コードは正しくfallback設計されている（null → DOM分析のみ）
- β環境ではAPI keyを設定して運用すべき
- テスト環境ではスキップが現実的

**リスク**:
- DOM分析のみの場合、画像内テキストやレイアウト分析の精度が低下

---

## Backlog（発見した未決定事項）

| ID | 内容 | 優先度 | 発見Phase |
|----|------|--------|----------|
| BL-001 | 拡張→Dashboard API接続テスト（実際に動くか） | HIGH | 0 |
| BL-002 | E2Eテスト実行基盤の整備 | HIGH | 0 |
| BL-003 | build確認（Next.js build） | MEDIUM | 0 |
| BL-004 | プログレス表示の実パイプライン連動 | LOW | 0 |
| BL-005 | CORS制限の段階的強化 | LOW | 0 |
