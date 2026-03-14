/**
 * Publish Gate — API Proxy (Cloudflare Workers)
 * 4ステップ分析パイプライン: 企業を知る → ページを見る → 診断する → 依頼パックを出す
 * Progressive Prompt: Layer 0-3 に応じてシステムプロンプトを段階拡張
 *
 * セキュリティ:
 * - SSRF防御: プライベートIP・localhost拒否、スキーム制限
 * - レート制限: IP単位 10req/min、月間5回（Free層）
 * - リクエストサイズ制限: 10KB
 *
 * env secrets: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request);

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    try {
      if (url.pathname === '/api/analyze') return handleAnalyze(request, env, cors);
      if (url.pathname === '/api/share') return handleShare(request, env, cors);
      if (url.pathname === '/health') return json({ status: 'ok', version: '0.5.0' }, cors);
      return json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }, cors, 404);
    } catch (e) {
      return json({ error: { code: 'INTERNAL', message: e.message } }, cors, 500);
    }
  },
};

// ─── Analyze ───────────────────────────────────────────────
async function handleAnalyze(request, env, cors) {
  if (request.method !== 'POST') {
    return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, cors, 405);
  }

  // Request size limit (10KB)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 10240) {
    return json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'リクエストボディが大きすぎます（上限10KB）' } }, cors, 413);
  }

  const body = await request.json();
  const { url, layer = 0, judgment_history = [], gsc_data, ga4_data } = body;

  if (!url || typeof url !== 'string') {
    return json({ error: { code: 'MISSING_URL', message: 'url is required' } }, cors, 400);
  }

  // SSRF defense: validate URL
  const validation = validateUrl(url);
  if (!validation.valid) {
    return json({ error: { code: 'INVALID_URL', message: validation.error } }, cors, 400);
  }

  // Rate limiting
  const clientIP = getClientIP(request);

  const minuteCheck = checkRateLimit(`minute:${clientIP}`, RATE_LIMITS.per_minute);
  if (!minuteCheck.allowed) {
    return json(
      { error: { code: 'RATE_LIMITED', message: 'レート制限に達しました。しばらくお待ちください。' } },
      { ...cors, 'Retry-After': String(Math.ceil((minuteCheck.reset_at - Date.now()) / 1000)) },
      429
    );
  }

  const monthlyCheck = checkRateLimit(`monthly:${clientIP}`, RATE_LIMITS.free_monthly);
  if (!monthlyCheck.allowed) {
    return json(
      { error: { code: 'MONTHLY_LIMIT', message: '月間の無料分析回数（5回）に達しました。' } },
      { ...cors, 'Retry-After': String(Math.ceil((monthlyCheck.reset_at - Date.now()) / 1000)) },
      429
    );
  }

  const systemPrompt = buildAnalyzePrompt(layer, judgment_history, gsc_data, ga4_data);
  const userContent = `以下のURLのLPを分析してください: ${validation.sanitized_url}`;

  const result = await callClaude(env, systemPrompt, userContent);

  // Wrap in AnalyzeResponse format
  const response = {
    id: crypto.randomUUID(),
    url: validation.sanitized_url,
    status: result.parse_error ? 'error' : 'completed',
    result: result.parse_error ? undefined : result,
    error: result.parse_error ? 'AI応答の解析に失敗しました' : undefined,
    created_at: new Date().toISOString(),
  };

  return json(response, {
    ...cors,
    'X-RateLimit-Remaining': String(monthlyCheck.remaining),
    'X-RateLimit-Reset': new Date(monthlyCheck.reset_at).toISOString(),
  });
}

function buildAnalyzePrompt(layer, history, gsc, ga4) {
  let prompt = `あなたはPublish Gate分析エンジンです。日本のLP専門分析。

## 行動原則
- 課題をインパクト順に構造化→デザイナー/エンジニア向けブリーフ作成
- コピー文言は出さず構造変化を提案
- 薬機法・景表法リスクは必ず検知
- 観測できる事実と推定を明確に区別する
- 確からしさが低い場合は断定しない（「〜と推定されます（確度：中）」）
- 良い点も認識し無理な提案はしない
- 根拠のない推測禁止。「もっと良くする」等の曖昧表現禁止

## 検知ルール
薬機法: 効果効能の直接表現、機能性表示食品の乖離、B/A写真制限、医師推薦（具体名必要）、「個人の感想です」要否
景品表示法: 優良誤認/有利誤認、「No.1」「業界初」根拠、二重価格適正性、成果数値根拠
CRO: FV3秒ルール、CTA近接性、社会的証明配置、認知的負荷

## 出力形式
以下のJSON形式のみを出力してください。JSON以外のテキストは含めないでください。

{
  "company_understanding": {
    "summary": "企業・事業の要約",
    "industry": "業種",
    "business_model": "ビジネスモデル",
    "site_cta_structure": "サイト全体のCTA構造"
  },
  "page_reading": {
    "page_type": "サービスLP|料金ページ|事例ページ|採用ページ|その他",
    "fv_main_copy": "FVのメインコピー",
    "fv_sub_copy": "FVのサブコピー",
    "cta_map": [{"text": "", "position": "", "prominence": "primary|secondary|tertiary"}],
    "trust_elements": "信頼要素の説明",
    "content_structure": "コンテンツ構造の説明",
    "confidence": "high|medium|low",
    "screenshot_insights": "視覚的な分析所見",
    "dom_insights": "DOM構造からの分析所見"
  },
  "improvement_potential": "+XX%",
  "issues": [
    {
      "priority": 1,
      "title": "課題タイトル",
      "diagnosis": "診断内容",
      "impact": "high|medium|low",
      "handoff_to": "designer|engineer|copywriter+designer|marketer",
      "brief": {
        "objective": "目的",
        "direction": "改善の方向性",
        "specifics": "具体的な変更内容",
        "constraints": ["制約条件"],
        "qa_checklist": ["確認項目"]
      },
      "evidence": "根拠"
    }
  ],
  "regulatory": {
    "yakujiho_risks": [{"expression": "", "risk_level": "high|medium|low", "reason": "", "recommendation": ""}],
    "keihinhyoujiho_risks": [{"expression": "", "risk_level": "high|medium|low", "reason": "", "recommendation": ""}]
  }`;

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

// ─── Share ───────────────────────────────────────────────
async function handleShare(request, env, cors) {
  if (request.method !== 'POST') {
    return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, cors, 405);
  }

  const body = await request.json();
  const { analysis_id, result } = body;

  if (!analysis_id || !result) {
    return json({ error: { code: 'MISSING_FIELDS', message: 'analysis_id and result are required' } }, cors, 400);
  }

  const shareId = crypto.randomUUID();
  return json({
    id: shareId,
    analysis_id,
    url: result.url || '',
    created_at: new Date().toISOString(),
  }, cors);
}

// ─── SSRF Defense ──────────────────────────────────────────
// Dashboard の url-validator.ts と同等のロジック

const PRIVATE_IP_RANGES = [
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,           // 127.0.0.0/8
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,             // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12
  /^192\.168\.\d{1,3}\.\d{1,3}$/,                // 192.168.0.0/16
  /^169\.254\.\d{1,3}\.\d{1,3}$/,                // 169.254.0.0/16
  /^0\.0\.0\.0$/,                                 // 0.0.0.0
  /^::1$/,                                        // IPv6 loopback
  /^fc00:/i,                                      // IPv6 unique local
  /^fe80:/i,                                      // IPv6 link-local
];

function validateUrl(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'URLが入力されていません' };
  }

  const trimmed = input.trim();

  // Block dangerous schemes
  if (/^(javascript|data|vbscript|file|ftp):/i.test(trimmed)) {
    return { valid: false, error: '許可されていないURLスキームです' };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    try {
      parsed = new URL(`https://${trimmed}`);
    } catch {
      return { valid: false, error: '有効なURLを入力してください' };
    }
  }

  // Protocol check
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'httpまたはhttpsのURLのみ対応しています' };
  }

  const hostname = parsed.hostname;

  // Block IPv6 in brackets
  if (hostname.startsWith('[') || hostname === '::1') {
    return { valid: false, error: 'IPアドレス直指定は許可されていません' };
  }

  // Check private IPs
  if (isIPAddress(hostname) && isPrivateIP(hostname)) {
    return { valid: false, error: 'プライベートIPアドレスへのアクセスは許可されていません' };
  }

  // Block localhost
  if (isLocalhost(hostname)) {
    return { valid: false, error: 'ローカルアドレスへのアクセスは許可されていません' };
  }

  return { valid: true, sanitized_url: parsed.toString() };
}

function isIPAddress(hostname) {
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^[\da-f:]+$/i.test(hostname) || hostname.startsWith('[')) return true;
  return false;
}

function isPrivateIP(ip) {
  const cleaned = ip.replace(/^\[|\]$/g, '');
  return PRIVATE_IP_RANGES.some((range) => range.test(cleaned));
}

function isLocalhost(hostname) {
  const lower = hostname.toLowerCase();
  return (
    lower === 'localhost' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower === '[::1]' ||
    lower.endsWith('.localhost')
  );
}

// ─── Rate Limiter ──────────────────────────────────────────
// In-memory rate limiter (resets on deploy; production should use KV)
// Dashboard の rate-limiter.ts と同等のロジック

const rateLimitStore = new Map();

const RATE_LIMITS = {
  free_monthly: { max_requests: 5, window_ms: 30 * 24 * 60 * 60 * 1000 },
  per_minute:   { max_requests: 10, window_ms: 60 * 1000 },
};

function checkRateLimit(key, config) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now >= entry.reset_at) {
    rateLimitStore.set(key, { count: 1, reset_at: now + config.window_ms });
    return { allowed: true, remaining: config.max_requests - 1, reset_at: now + config.window_ms };
  }

  if (entry.count >= config.max_requests) {
    return { allowed: false, remaining: 0, reset_at: entry.reset_at };
  }

  entry.count++;
  return { allowed: true, remaining: config.max_requests - entry.count, reset_at: entry.reset_at };
}

function getClientIP(request) {
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Extension-Version, X-Source',
    'Access-Control-Max-Age': '86400',
  };
}
