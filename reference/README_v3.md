# Publish Gate v3.0 — Zero-Base Redesign Implementation

## What Changed (v2.0 → v3.0)

| Element | v2.0 | v3.0 | Why |
|---------|------|------|-----|
| **Product Definition** | OS or Tool (dual) | Tool → OS (staged) | Scope + extensibility |
| **AI Input** | DOM structure only | DOM + FV text + CTA context | 「訴求の質」を評価可能に |
| **Framing** | 公開判断 (PASS/FAIL) | 改善推進 (提案×3) | 精度70%でも成立するフレーム |
| **Core Feature** | 即時反映 (preview) | 依頼パック (spec) | Layer 3ペイン直接解決 |
| **UI** | 7 screens | 3 screens | 360px Side Panel最適化 |
| **Logs** | Judgment + reason | Before/After + result | ラボノート = MOAT |
| **Pricing** | Free → ¥9,800 cliff | Free → ¥4,980 → ¥14,800 | インタビュー発言に基づく |
| **Rate Limit** | 5回/日 (L0) | 3回/日 (L0) | "もっと欲しい"を早く作る |
| **Conversion Gate** | ログ永続化 | 依頼パックのコピー | 最後のアクションだけを制限 |

## Directory Structure

```
publish-gate-v3/
├── manifest.json            # Chrome Extension manifest (v3.0)
├── package.json
├── _locales/ja/messages.json
├── shared/
│   └── constants.js         # Layers, screens, categories, config
├── content/
│   └── content-script.js    # DOM extraction + FV text + CTA context
├── background/
│   └── service-worker.js    # Message routing + lab notes
├── sidepanel/
│   ├── index.html           # 3-screen layout
│   ├── styles.css           # 360px optimized
│   └── app.js               # Complete UI rewrite
├── workers/
│   └── proxy-worker.js      # Cloudflare Worker (redesigned prompt)
├── test/
│   └── phase0-prompt-test.mjs  # ★ Phase 0 validation script
└── assets/                  # Icons (copy from v2.0)
```

## Phase 0: The 1-Day Test (MOST CRITICAL)

**これが全てのGO/NO-GO判定。**

### Prerequisites

- Anthropic API key
- Node.js 18+

### Run

```bash
ANTHROPIC_API_KEY=sk-xxx node test/phase0-prompt-test.mjs
```

### What It Does

1. Uses sample page data (BtoB SaaS LP + コーポレートサイト)
2. Sends to Claude API with the v3.0 redesigned prompt
3. Outputs proposals for human review
4. Auto-scores structural quality

### GO Condition

Show the output to an internal marketer and ask:
**「この提案、やりたいですか？」**

- 3/5 say "やりたい" → **GO**. Start F0 development.
- < 3/5 → Fix prompt and retry once.

### Using Real Page Data

For more accurate testing:

1. Open target page in Chrome DevTools console
2. Paste `content/content-script.js` and execute it
3. Run `JSON.stringify(window.__publishGate.extractFeatures())` 
4. Copy the JSON output
5. Replace sample data in `test/phase0-prompt-test.mjs`

## Key Architecture Decisions

### 1. FV Text Extraction (content-script.js)

**v2.0 fatal flaw:** AI received only meta tags, headings, and CTA text. No body text.
→ AI could never evaluate "訴求の質" (quality of the pitch).

**v3.0 fix:** Extract visible text from top 1000px (max 30 elements).
Token increase: +500-1000 (~¥2-5/request). Acceptable tradeoff.

### 2. Framing Shift (proxy-worker.js)

**v2.0:** "公開判断エキスパート" → PASS/FAIL/HOLD output
→ "チェック" with 70% accuracy = trust loss

**v3.0:** "改善推進エキスパート" → 3 proposals (prioritized)
→ "改善ポイントを探す" with 70% accuracy = "finds 70% of issues" = acceptable

### 3. Conversion Gate (sidepanel/app.js)

**v2.0:** L0→L1 gate = log persistence (weak motivation)
**v3.0:** L0→L1 gate = 依頼パック copy permission
→ Gates the **last step of action** (handing spec to designer), not the analysis itself
→ User sees full value before hitting the gate

### 4. Lab Notebook Logs (service-worker.js)

**v2.0:** `{ judgment, reason, result }` — no Before/After → no causal learning
**v3.0:** `{ proposals[{category, before, after}], result, metrics_delta }` — enables pattern learning

After 10+ logs, AI can infer: "This site's trust improvements work well."
**This is true MOAT.** Late entrants can't replicate accumulated learning.

## Deployment

### Chrome Extension

1. Copy `assets/` from v2.0 (icons)
2. Load unpacked in `chrome://extensions/`
3. Enable Side Panel

### Cloudflare Worker

```bash
cd workers/
wrangler publish proxy-worker.js
wrangler secret put ANTHROPIC_API_KEY
```

## Execution Timeline

| Phase | Week | Scope | GO/NO-GO |
|-------|------|-------|----------|
| 0 | 0 | **Prompt quality validation (1 day)** | 3/5 "やりたい" |
| F0 | 1-3 | Layer 0-1 implementation | Stable on 20 pages |
| F1 | 4-6 | Internal β (藤野型 3-5名) | Completion >80% |
| F2 | 7-10 | Public β (50名) | Payment intent >20% |
| F3 | 11 | Official launch | Installs >500 |
