# AI時代のSoR転換とAgentチームパターン

## 議論の要約

### SoR（System of Record）の不可逆的転換

従来のSoRは「人間が業務を行い、その結果を記録するシステム」だった（Salesforce、会計ソフト等）。
AI時代には業務の実行主体がAgentになるため、**Agentの実行ログそのものがSoR**になる。

```
従来: 人間が業務 → 人間がSaaSに記録 → SaaSがSoR
AI時代: Agentが業務 → ログが自動生成 → Agentの副産物がSoR
```

### SoA（System of Action）の所在

Claude Codeにおける実体:
```bash
find ~/.claude/projects/ -name "*.jsonl"
```
Agentが何を考え、何を実行し、何が起きたかの全記録がここに残る。
SaaSが「行動管理」の価値を主張しても、Agentのログの前では冗長になる。

### gstackパターン（Garry Tan / YC CEO）

「1つの賢いAIを使う」から「**役割分担されたAIチームを持つ**」への転換。
Claude Codeのカスタムコマンドで以下の役割を切り替える:

| コマンド | 役割 | 機能 |
|---------|------|------|
| `/plan-ceo-review` | CEO | 「そもそも何を作るべきか」を問い直す |
| `/plan-eng-review` | EM | 設計・データフロー・障害パターンを詰める |
| `/review` | Staff Engineer | CI通過するが本番で死ぬバグを洗う |
| `/ship` | Release担当 | main同期→テスト→PR作成まで一気通貫 |
| `/browse` | QA（ブラウザ） | Playwrightで操作→スクショ→console確認 |
| `/qa` | QA（回帰） | git diffから影響範囲推定→踏み抜きテスト |
| `/retro` | スクラムマスター | ふりかえりテンプレ化 |

---

## 本質の抽出

### 1. Agentが業務の上流〜下流を押さえると、記録は副産物になる

業務フロー全体をAgentが実行する場合、「何をやったか」「なぜやったか」「結果どうなったか」はすべてログに残る。別途「記録システム」を作る必要がない。

**Publish Gateへの適用:**
- URL入力→分析→課題特定→依頼書生成 の全フローをAgentが実行
- その過程の全記録（分析結果JSON、依頼書、判断根拠）が自動的にSoRになる
- 「レポート作成」という独立した工程が消滅する（= 浦田型・七條型の課題が根本解決）

### 2. 役割分離は「プロンプトの切り替え」で実現できる

gstackの本質は「同じAIに異なるペルソナを与える」こと。これにより:
- **視点の網羅性**: CEO視点の「作るべきか？」とEng視点の「作れるか？」は両立しにくい。分離することで両方が機能する
- **品質ゲート**: 実装者とレビュワーを分離することで、セルフレビューの甘さを回避
- **自動化の粒度**: `/ship`のように「判断不要な手順」は完全自動化、`/plan-ceo-review`のように「判断が必要な工程」は対話的に

### 3. 「SaaSのAgent化」ではなく「Agentの専門化」が正しい方向

既存SaaSにAI機能を足す（Copilot化）のではなく、Agentに専門知識を注入する方が構造的に正しい。
理由: Agentは業務フロー全体を押さえているが、SaaSは自分の機能範囲しか見えない。

**Publish Gateへの適用:**
- Publish Gateは「マーケティングSaaS」ではなく「マーケティング専門Agent」
- URLを入れるだけで全部出る = Agentが業務フロー全体を実行する設計
- ダッシュボードUIはAgentの出力を人間が確認するためのインターフェース

---

## Claude Codeでの実装パターン

### パターンA: カスタムスラッシュコマンドによる役割分離

`~/.claude/commands/` にMarkdownファイルを配置すると `/コマンド名` で呼び出せる。

```
~/.claude/commands/
├── plan-ceo-review.md    # CEO視点レビュー
├── plan-eng-review.md    # エンジニアリング視点レビュー
├── review.md             # コードレビュー
├── ship.md               # リリース自動化
├── qa.md                 # QA自動化
└── retro.md              # ふりかえり
```

### パターンB: プロジェクト固有コマンド（CLAUDE.mdと連動）

プロジェクトルートの `.claude/commands/` に配置すると、そのプロジェクト専用のコマンドになる。

```
.claude/commands/
├── analyze-lp.md         # LP分析実行
├── review-analysis.md    # 分析結果のレビュー
├── generate-brief.md     # 依頼書生成
└── validate-security.md  # セキュリティ検証
```

### パターンC: CLAUDE.mdへのスキル統合

gstackのアプローチ: CLAUDE.mdに「使えるコマンド一覧」と「デフォルト動作」を記載し、Agentの基本動作を定義する。

---

## Publish Gate向け実装例: Agentチームパターン

### `/pg-diagnose` — マーケ責任者ロール
```markdown
あなたはマーケティング責任者として振る舞う。
以下のURLのLPを診断し、ビジネスインパクト順に課題を構造化せよ。

判断基準:
- CVRへの影響度（推定）
- 実装コスト（低/中/高）
- 確信度（データに基づく/推定/仮説）

出力: CLAUDE.mdの出力JSON構造に従う。
「なぜその数字になっているのか」を説明できる粒度で。
```

### `/pg-brief` — ディレクターロール
```markdown
あなたはクリエイティブディレクターとして振る舞う。
直前の診断結果から、デザイナー/エンジニア向けの依頼書を生成せよ。

原則:
- コピー文言は出さない（構造変化を図示）
- 各依頼に「目的」「方向性」「具体指示」「制約」「QAチェックリスト」を含める
- handoff先（designer / engineer / copywriter+designer）を明示
```

### `/pg-review` — QAロール
```markdown
あなたはシニアQAエンジニアとして振る舞う。
直前の分析パイプラインの出力を検証せよ。

チェック項目:
1. Vision APIの読み取り精度: FVスクショとDOMの矛盾はないか
2. 課題の優先順位: インパクト順になっているか
3. 依頼書の実行可能性: デザイナーがこれだけで作業できるか
4. 薬機法チェック: 該当表現の見落としはないか
5. セキュリティ: SSRF防御、PII漏洩、プロンプトインジェクション
```

### `/pg-ship` — リリース担当ロール
```markdown
以下を順に実行せよ:
1. git fetch origin main && git rebase origin/main
2. TypeScript型チェック: npx tsc --noEmit
3. テスト実行: npm test
4. セキュリティテスト: SEC-1〜SEC-13（governance/04_ACCEPTANCE_CRITERIA.md参照）
5. 全パスしたらコミット→push→PR作成
6. 1つでも失敗したら停止し、失敗内容を報告
```

### `/pg-retro` — ふりかえりロール
```markdown
直近の開発セッションをふりかえる。以下を構造化して出力:

## 完了したこと
- [タスク]: [結果]

## うまくいったこと
-

## 改善すべきこと
-

## 次にやるべきこと
- governance/01_PHASE_0_5_BACKLOG.md との照合結果

## 判断ログ（governance/02_DECISION_LOG.mdに追記）
- DEC-XXX: [判断内容] / [根拠] / [影響範囲]
```

---

## SoRとしてのログ設計

### Agentの実行ログが自動的にSoRになる条件

1. **構造化**: JSON形式で出力（既にCLAUDE.mdで定義済み）
2. **追跡可能性**: 各分析に一意IDを付与（crypto.randomUUID()）
3. **判断根拠の記録**: なぜその課題を優先したかの根拠をログに含める
4. **差分の可視化**: 同一URLの時系列比較が可能な形式

### Publish Gateが持つべきログ構造

```json
{
  "analysis_id": "uuid",
  "url": "https://example.com",
  "timestamp": "2024-01-01T00:00:00Z",
  "agent_trace": {
    "step1_company_understanding": { "input": "...", "output": "...", "confidence": 0.9 },
    "step2_page_reading": { "input": "...", "output": "...", "confidence": 0.85 },
    "step3_diagnosis": { "input": "...", "output": "...", "confidence": 0.8 },
    "step4_brief_generation": { "input": "...", "output": "..." }
  },
  "issues_count": 5,
  "improvement_potential": "+23%",
  "shared": false,
  "share_id": null
}
```

このログ自体が:
- **浦田型**にとっての「なんでその数字になっているのかの記録」
- **七條型**にとっての「施策ログ」（手動記録不要）
- **藤野型**にとっての「案件ごとの分析履歴」

になる。SoRを別途作る必要がない。

---

## 結論

| 概念 | 従来SaaS | Agent時代 |
|------|---------|----------|
| SoR | SaaSのDB | Agentの実行ログ |
| SoA | SaaSのUI | Agentのコマンド体系 |
| 品質管理 | 人間のレビュー | 役割分離されたAgentレビュー |
| 業務知識 | SaaSの機能設計 | Agent（CLAUDE.md等）への知識注入 |
| リテンション | SaaSへのロックイン | Agentの実行履歴・学習の蓄積 |

Publish Gateは「マーケティングSaaS」ではなく「マーケティング業務を実行するAgentシステム」。
そのAgentが生むログがSoRになり、UIはログの閲覧・共有インターフェースに過ぎない。
