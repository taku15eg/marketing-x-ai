/**
 * Publish Gate v2.0 — API Proxy (Cloudflare Workers)
 * Progressive Prompt: Layer 0-3 に応じてシステムプロンプトを段階拡張
 *
 * env secrets: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request);

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    try {
      if (url.pathname === '/api/v1/analyze') return handleAnalyze(request, env, cors);
      if (url.pathname === '/api/v1/handoff') return handleHandoff(request, env, cors);
      if (url.pathname === '/api/v1/memo') return handleMemo(request, env, cors);
      if (url.pathname === '/health') return json({ status: 'ok', version: '2.0.0' }, cors);
      return json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }, cors, 404);
    } catch (e) {
      return json({ error: { code: 'INTERNAL', message: e.message } }, cors, 500);
    }
  },
};

// ─── Analyze ───────────────────────────────────────────────
async function handleAnalyze(request, env, cors) {
  const body = await request.json();
  const { page_features, layer = 0, judgment_history = [], gsc_data, ga4_data, confirmed_goal } = body;

  if (!page_features) return json({ error: { code: 'MISSING_FEATURES', message: 'page_features is required' } }, cors, 400);

  const systemPrompt = buildAnalyzePrompt(layer, judgment_history, gsc_data, ga4_data);
  const userContent = confirmed_goal
    ? `以下のページ特徴量と、ユーザーが確認した推定内容に基づいて提案を生成してください。\n\n## 確認済み推定\n${JSON.stringify(confirmed_goal)}\n\n## ページ特徴量\n${JSON.stringify(page_features)}`
    : `以下のページ特徴量を分析してください。\n\n${JSON.stringify(page_features)}`;

  const result = await callClaude(env, systemPrompt, userContent);
  return json(result, cors);
}

function buildAnalyzePrompt(layer, history, gsc, ga4) {
  let prompt = `あなたはWebページの公開判断を支援するエキスパートです。

## 行動原則
- 観測できる事実と推定を明確に区別する
- 確からしさが低い場合は断定しない（「〜と推定されます（確度：中）」）
- 提案は最大3件、優先度順に並べる
- 各提案に必ず根拠を付ける
- 禁止ゾーン（価格の具体額・法務判断・規約・薬機法表現）に該当する場合はjudgmentをHOLDにする
- target_selectorは実在するCSSセレクタを指定する

## 出力形式
以下のJSON形式のみを出力してください。JSON以外のテキストは含めないでください。

{
  "goal_card": {
    "company_hypothesis": "会社・事業の推定",
    "page_role": "獲得LP|サービスページ|料金ページ|事例ページ|記事ページ|採用ページ|その他",
    "primary_cv": "主要CV",
    "secondary_cv": "副次CV（あれば）",
    "good_outcome_hypothesis": "良い成果の仮説",
    "confidence": "high|medium|low",
    "confidence_reason": "確からしさの理由"
  },
  "judgment": "PASS|FAIL|HOLD",
  "judgment_reason": "判断理由（1-2文）",
  "proposals": [
    {
      "priority": 1,
      "title": "提案タイトル",
      "category": "copy|cta|layout|trust|speed|seo",
      "before": "現状",
      "after": "変更後",
      "evidence": "根拠",
      "confidence": "high|medium|low",
      "target_selector": "CSSセレクタ",
      "change_type": "text|style|html",
      "risk": "リスク（あれば）"
    }
  ]`;

  // Layer 0: add upgrade hint
  if (layer === 0) {
    prompt += `,\n  "layer_upgrade_hint": "GSCを連携すると、流入クエリに基づいたより具体的な訴求改善を提案できます"`;
  }

  prompt += `\n}`;

  // Layer 1: add history context
  if (layer >= 1 && history.length > 0) {
    prompt += `\n\n## 過去の判断ログ\nこのユーザーが過去に行った判断の履歴です：\n${JSON.stringify(history)}\n\nこのログから読み取れるパターン（勝ちパターン、失敗パターン）を提案に反映してください。`;
  }

  // Layer 2: add GSC data
  if (layer >= 2 && gsc) {
    prompt += `\n\n## Google Search Console データ（直近28日）\n${JSON.stringify(gsc)}\n\n流入クエリ上位のニーズとページ訴求の乖離を分析し、検索意図に合った改善を提案に含めてください。CTRが相場と比べて低いクエリがあれば原因を特定してください。layer_upgrade_hintは不要です。`;
  }

  // Layer 3: add GA4 data
  if (layer >= 3 && ga4) {
    prompt += `\n\n## Google Analytics 4 データ（直近28日）\n${JSON.stringify(ga4)}\n\nCVRが同カテゴリの相場と比べてどうか分析してください。直帰率が高い場合は原因仮説を立て、数値に基づいた具体的な改善提案を含めてください。`;
  }

  return prompt;
}

// ─── Handoff ───────────────────────────────────────────────
async function handleHandoff(request, env, cors) {
  const body = await request.json();
  const { goal_card, selected_proposal, page_features } = body;

  const systemPrompt = `あなたはWebページの実装依頼パックを生成するエキスパートです。
デザイナーとエンジニアが「これだけ見れば実装できる」粒度で出力してください。

## 品質ゲート
- 全changesにtarget（セレクタ）が存在すること
- 全changesにbefore/afterが存在すること
- qa_checklistが各changeに最低1項目あること
- rollback_planが空でないこと
不足がある場合は生成を拒否し、不足項目を返してください。

## 出力JSON
{
  "purpose": "施策の目的（1文）",
  "target_url": "対象URL",
  "changes": [{ "target": "CSSセレクタ", "type": "text|style|structure|add|remove", "before": "現状", "after": "変更後", "reason": "変更理由", "qa_checklist": ["確認項目"] }],
  "overall_qa": ["全体確認項目"],
  "rollback_plan": "戻し方",
  "expected_impact": "期待される影響"
}`;

  const userContent = `推定: ${JSON.stringify(goal_card)}\n提案: ${JSON.stringify(selected_proposal)}\nページ: ${JSON.stringify(page_features)}`;
  const result = await callClaude(env, systemPrompt, userContent);
  return json(result, cors);
}

// ─── Memo ──────────────────────────────────────────────────
async function handleMemo(request, env, cors) {
  const body = await request.json();
  const { goal_card, proposals, selected_action } = body;

  const systemPrompt = `あなたは承認メモを生成するエキスパートです。
上司やチームに共有できる判断メモを生成してください。1枚で完結が原則です。

## 出力JSON
{
  "summary": "判断の結論（1文）",
  "reason": "理由（2-3文）",
  "risks": ["リスク1"],
  "exceptions": ["例外条件1"],
  "next_steps": ["次のアクション1"],
  "evidence_summary": "根拠の要約"
}`;

  const userContent = `推定: ${JSON.stringify(goal_card)}\n提案: ${JSON.stringify(proposals)}\nアクション: ${selected_action}`;
  const result = await callClaude(env, systemPrompt, userContent);
  return json(result, cors);
}

// ─── Claude API ────────────────────────────────────────────
async function callClaude(env, systemPrompt, userContent) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { raw: text, parse_error: true };
  }
}

// ─── Helpers ───────────────────────────────────────────────
function json(data, cors, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

function corsHeaders(request) {
  return {
    'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Extension-Version, X-Layer',
    'Access-Control-Max-Age': '86400',
  };
}
