// Tab 2: Ad Creative Generator
// Generates Google Ads RSA, Meta Ads, and PMax creatives from LP analysis results

import type { AnalysisResult, AdCreativeResult } from './types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export async function generateAdCreatives(
  analysisResult: AnalysisResult,
  analysisId: string
): Promise<AdCreativeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const systemPrompt = buildAdCreativeSystemPrompt();
  const userContent = buildAdCreativeUserContent(analysisResult);

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
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
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
  if (!textBlock) {
    throw new Error('Claude API returned no text content');
  }

  return parseAdCreativeResponse(textBlock.text, analysisId);
}

function buildAdCreativeSystemPrompt(): string {
  return `広告訴求文生成エンジン。LP分析結果から各広告プラットフォーム向けのクリエイティブを逆算生成する。

ルール:
- LP分析で特定した課題・強み・ターゲットに基づいて訴求を設計
- 各プラットフォームの文字数制限を厳守
- 訴求角度（angle）を明示し、なぜその角度が有効かを根拠付き説明
- 薬機法・景品表示法リスクのある表現は絶対に使わない
- LP上の具体的な強み・実績・数値を活用

文字数制限:
- Google Ads RSA: 見出し30文字以内×15本, 説明文90文字以内×4本
- Meta Ads: プライマリテキスト125文字以内×3本, 見出し40文字以内×5本, 説明文30文字以内×5本
- PMax: 見出し30文字以内×5本, 長い見出し90文字以内×5本, 説明文90文字以内×4本

訴求角度の例: 課題解決型, 実績・数値型, 感情訴求型, 比較優位型, 緊急性型, 権威性型, ベネフィット直訴型

JSON出力のみ。他テキスト禁止。
{"google_ads":{"headlines":[{"text":"","char_count":0,"angle":""}],"descriptions":[{"text":"","char_count":0,"angle":""}],"rationale":""},"meta_ads":{"primary_texts":[{"text":"","char_count":0,"angle":""}],"headlines":[{"text":"","char_count":0,"angle":""}],"descriptions":[{"text":"","char_count":0,"angle":""}],"recommended_format":"","rationale":""},"pmax":{"headlines":[{"text":"","char_count":0,"angle":""}],"long_headlines":[{"text":"","char_count":0,"angle":""}],"descriptions":[{"text":"","char_count":0,"angle":""}],"rationale":""},"targeting_recommendations":[{"platform":"google|meta","audience_type":"","description":"","rationale":""}]}`;
}

function buildAdCreativeUserContent(result: AnalysisResult): string {
  const parts = [
    '以下のLP分析結果に基づいて、広告訴求文を生成してください。',
    '',
    '<analysis_result>',
    `企業概要: ${result.company_understanding.summary}`,
    `業種: ${result.company_understanding.industry}`,
    `ビジネスモデル: ${result.company_understanding.business_model}`,
    `CTA構造: ${result.company_understanding.site_cta_structure}`,
    '',
    `ページタイプ: ${result.page_reading.page_type}`,
    `メインコピー: ${result.page_reading.fv_main_copy}`,
    `サブコピー: ${result.page_reading.fv_sub_copy}`,
    `信頼要素: ${result.page_reading.trust_elements}`,
    `コンテンツ構造: ${result.page_reading.content_structure}`,
    '',
    `改善ポテンシャル: ${result.improvement_potential}`,
    '',
    '課題一覧:',
    ...result.issues.map(
      (issue) =>
        `  P${issue.priority}: ${issue.title} (${issue.impact}) - ${issue.diagnosis}`
    ),
    '',
    'CTA一覧:',
    ...result.page_reading.cta_map.map(
      (cta) => `  - "${cta.text}" (position: ${cta.position}, prominence: ${cta.prominence})`
    ),
  ];

  if (result.regulatory) {
    parts.push('', '法規制リスク（これらの表現は広告でも避けること）:');
    for (const risk of result.regulatory.yakujiho_risks) {
      parts.push(`  - [薬機法] ${risk.expression}: ${risk.reason}`);
    }
    for (const risk of result.regulatory.keihinhyoujiho_risks) {
      parts.push(`  - [景表法] ${risk.expression}: ${risk.reason}`);
    }
  }

  parts.push('</analysis_result>');

  return parts.join('\n');
}

function parseAdCreativeResponse(
  responseText: string,
  analysisId: string
): AdCreativeResult {
  let jsonStr = responseText;
  const codeBlockMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr);

    return {
      analysis_id: analysisId,
      generated_at: new Date().toISOString(),
      google_ads: {
        headlines: normalizeAdItems(parsed.google_ads?.headlines || [], 30),
        descriptions: normalizeAdItems(parsed.google_ads?.descriptions || [], 90),
        rationale: parsed.google_ads?.rationale || '',
      },
      meta_ads: {
        primary_texts: normalizeAdItems(parsed.meta_ads?.primary_texts || [], 125),
        headlines: normalizeAdItems(parsed.meta_ads?.headlines || [], 40),
        descriptions: normalizeAdItems(parsed.meta_ads?.descriptions || [], 30),
        recommended_format: parsed.meta_ads?.recommended_format || '',
        rationale: parsed.meta_ads?.rationale || '',
      },
      pmax: {
        headlines: normalizeAdItems(parsed.pmax?.headlines || [], 30),
        long_headlines: normalizeAdItems(parsed.pmax?.long_headlines || [], 90),
        descriptions: normalizeAdItems(parsed.pmax?.descriptions || [], 90),
        rationale: parsed.pmax?.rationale || '',
      },
      targeting_recommendations: (parsed.targeting_recommendations || []).map(
        (rec: Record<string, unknown>) => ({
          platform: rec.platform || 'google',
          audience_type: rec.audience_type || '',
          description: rec.description || '',
          rationale: rec.rationale || '',
        })
      ),
    };
  } catch (e) {
    throw new Error(`Failed to parse ad creative response as JSON: ${e}`);
  }
}

function normalizeAdItems(
  items: Array<Record<string, unknown>>,
  maxChars: number
): Array<{ text: string; char_count: number; angle: string }> {
  return items.map((item) => {
    const text = (item.text as string) || '';
    return {
      text: text.slice(0, maxChars),
      char_count: text.length,
      angle: (item.angle as string) || '',
    };
  });
}
