// Step 1: Company Research
// Fetches and understands the company behind the URL

import { fetchWithSSRFProtection } from './url-validator';
import { stripHtml as sharedStripHtml } from './html-utils';
import type { CompanyResearchResult, BrandTone, IndustryCategory, RegulatoryFlags } from './types';

export async function researchCompany(url: string): Promise<CompanyResearchResult> {
  const parsed = new URL(url);
  const domain = parsed.hostname;
  const origin = parsed.origin;

  // Fetch the target page and root page in parallel
  const [targetHtml, rootHtml] = await Promise.allSettled([
    fetchPageHtml(url),
    url !== origin + '/' ? fetchPageHtml(origin + '/') : Promise.resolve(''),
  ]);

  const targetContent = targetHtml.status === 'fulfilled' ? targetHtml.value : '';
  const rootContent = rootHtml.status === 'fulfilled' ? rootHtml.value : '';

  // Extract company info from HTML
  const companyInfo = extractCompanyInfo(targetContent, rootContent, domain);

  return companyInfo;
}

async function fetchPageHtml(url: string): Promise<string> {
  try {
    const response = await fetchWithSSRFProtection(url, { timeout: 10000 });
    if (!response.ok) return '';
    const text = await response.text();
    // Limit to 50,000 chars as per spec
    return text.slice(0, 50000);
  } catch {
    return '';
  }
}

function extractCompanyInfo(
  targetHtml: string,
  rootHtml: string,
  domain: string
): CompanyResearchResult {
  const combined = targetHtml + '\n' + rootHtml;

  // Extract meta information
  const titleMatch = combined.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch = combined.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i);
  const ogSiteName = combined.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([\s\S]*?)["']/i);

  // Extract visible text (strip tags)
  const visibleText = stripHtml(combined);

  // Extract brand tone from content
  const brandTone = analyzeBrandTone(visibleText);

  // Extract credentials (numbers + achievements)
  const credentials = extractCredentials(visibleText);

  // Extract key vocabulary
  const keyVocabulary = extractKeyVocabulary(visibleText, domain);

  const companyName = ogSiteName?.[1] || titleMatch?.[1]?.split('|').pop()?.trim() || domain;

  // Industry classification and regulatory flag detection
  const industryCategory = classifyIndustry(visibleText, domain);
  const regulatoryFlags = detectRegulatoryFlags(visibleText, industryCategory);
  const businessModelHint = detectBusinessModel(visibleText, domain);

  return {
    company_overview: `${companyName}。${descMatch?.[1] || ''}`.trim(),
    brand_tone: brandTone,
    key_vocabulary: keyVocabulary,
    credentials,
    case_studies: [],
    industry_category: industryCategory,
    regulatory_flags: regulatoryFlags,
    business_model_hint: businessModelHint,
  };
}

/**
 * Classify industry from page content and domain.
 * Uses keyword-based heuristics for Phase 0.5.
 */
function classifyIndustry(text: string, domain: string): IndustryCategory {
  const combined = (text + ' ' + domain).toLowerCase();

  const industryPatterns: Array<{ primary: string; secondary: string | null; patterns: RegExp[] }> = [
    { primary: '健康食品・サプリメント', secondary: '医薬部外品', patterns: [/サプリ|健康食品|機能性表示|栄養補助|ビタミン|プロテイン|青汁|酵素|乳酸菌/] },
    { primary: '化粧品・美容', secondary: 'スキンケア', patterns: [/化粧品|コスメ|スキンケア|美容液|クリーム|ファンデ|シャンプー|育毛|脱毛/] },
    { primary: '医療・クリニック', secondary: null, patterns: [/クリニック|病院|医院|歯科|整形|美容外科|AGAメ|AGA治/] },
    { primary: 'SaaS・IT', secondary: 'BtoB', patterns: [/SaaS|クラウド|API|ダッシュボード|管理システム|業務効率|DX推進|マーケティングツール/] },
    { primary: 'EC・物販', secondary: null, patterns: [/通販|ショッピング|お買い物|カート|送料無料|商品一覧|セール|アウトレット/] },
    { primary: '不動産', secondary: null, patterns: [/不動産|マンション|物件|賃貸|分譲|リフォーム|住宅|一戸建て/] },
    { primary: '人材・採用', secondary: null, patterns: [/求人|転職|採用|人材|エージェント|キャリア|インターン|正社員/] },
    { primary: '教育・スクール', secondary: null, patterns: [/スクール|教室|講座|資格|学習|塾|研修|セミナー|オンライン学習/] },
    { primary: '金融・保険', secondary: null, patterns: [/保険|投資|ローン|融資|FX|証券|資産運用|クレジット|カードローン/] },
    { primary: '士業・コンサル', secondary: null, patterns: [/弁護士|税理士|司法書士|行政書士|社労士|コンサル|顧問/] },
    { primary: '飲食・フード', secondary: null, patterns: [/レストラン|カフェ|デリバリー|テイクアウト|居酒屋|料理|食材|宅配食/] },
  ];

  for (const { primary, secondary, patterns } of industryPatterns) {
    for (const pattern of patterns) {
      if (pattern.test(combined)) {
        return { primary, secondary, confidence: 'medium' };
      }
    }
  }

  return { primary: 'その他', secondary: null, confidence: 'low' };
}

/**
 * Detect regulatory flags based on industry and content keywords.
 * Focus: 薬機法 (Pharmaceutical Affairs Law) and 景品表示法 (Premiums and Representations Act)
 */
function detectRegulatoryFlags(text: string, industry: IndustryCategory): RegulatoryFlags {
  const flaggedCategories: string[] = [];

  // Pharmaceutical Affairs Law (薬機法) targets
  const pharmaPatterns = /サプリ|健康食品|機能性表示|栄養機能|特定保健|化粧品|コスメ|スキンケア|美容液|育毛|脱毛|医薬部外品|美白|シワ改善|抗菌|除菌|殺菌/;
  const hasPharmaRisk = pharmaPatterns.test(text);
  if (hasPharmaRisk) {
    flaggedCategories.push('薬機法対象');
  }

  // Premiums and Representations Act (景品表示法) indicators
  const representationPatterns = /No\.?\s*1|ナンバーワン|業界初|日本初|世界初|最安|最安値|満足度\s*\d+%|実績\s*\d+|効果\s*\d+%|改善率|成功率/;
  const hasRepresentationRisk = representationPatterns.test(text);
  if (hasRepresentationRisk) {
    flaggedCategories.push('景品表示法注意');
  }

  // Industry-based pharma flag
  const pharmaIndustries = ['健康食品・サプリメント', '化粧品・美容', '医療・クリニック'];
  const isPharmaIndustry = pharmaIndustries.includes(industry.primary);

  return {
    pharmaceutical_affairs_law: hasPharmaRisk || isPharmaIndustry,
    premiums_labeling_act: hasRepresentationRisk,
    flagged_categories: flaggedCategories,
  };
}

/**
 * Detect business model hint from content and domain.
 */
function detectBusinessModel(text: string, domain: string): string {
  const combined = (text + ' ' + domain).toLowerCase();

  if (/月額|サブスク|プラン|料金表|年額|月々/.test(combined)) return 'subscription';
  if (/カート|購入|お買い物|通販|送料/.test(combined)) return 'ec';
  if (/無料相談|お見積|案件|受託/.test(combined)) return 'service';
  if (/資料請求|お問い合わせ|導入事例|デモ/.test(combined)) return 'btob_lead_gen';
  if (/来店|予約|ご来院|アクセス/.test(combined)) return 'store_visit';
  if (/登録|会員|フリーミアム|freemium/.test(combined)) return 'freemium';

  return 'unknown';
}

function stripHtml(html: string): string {
  return sharedStripHtml(html);
}

function analyzeBrandTone(text: string): BrandTone {
  const sentences = text.split(/[。！？\n]/);
  const endings = new Set<string>();
  const toneKeywords = new Set<string>();

  const commonEndings = ['します', 'ます', 'です', 'ください', 'しましょう', 'できます', 'を実現', 'を支援'];
  const commonTones = ['信頼', '安心', '成長', '革新', '効率', '品質', '挑戦', '実績', '伴走', '共創'];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    for (const ending of commonEndings) {
      if (trimmed.endsWith(ending)) {
        endings.add(`〜${ending}`);
      }
    }
    for (const tone of commonTones) {
      if (trimmed.includes(tone)) {
        toneKeywords.add(tone);
      }
    }
  }

  const usesQuestions = /？/.test(text) || /\?/.test(text);

  return {
    sentence_endings: Array.from(endings).slice(0, 5),
    uses_questions: usesQuestions,
    tone_keywords: Array.from(toneKeywords).slice(0, 5),
    example_phrases: extractPhrases(text).slice(0, 3),
  };
}

function extractPhrases(text: string): string[] {
  const phrases: string[] = [];
  const sentences = text.split(/[。！？\n]/).filter((s) => s.trim().length > 10 && s.trim().length < 60);
  return sentences.slice(0, 5).map((s) => s.trim());
}

function extractCredentials(text: string): string[] {
  const credentials: string[] = [];
  const patterns = [
    /導入(企業|社数?)[\d,]+社/g,
    /\d+社(以上|超)/g,
    /累計[\d,]+[名万]/g,
    /[A-Z]\w+\s*(認[定証]|受賞|LEADER)/g,
    /ISO\d+/g,
    /実績[\d,]+[件社名]/g,
    /満足度[\d.]+/g,
    /\d+年の実績/g,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      credentials.push(...matches);
    }
  }

  return [...new Set(credentials)].slice(0, 5);
}

function extractKeyVocabulary(text: string, domain: string): string[] {
  // Extract frequently used terms (2+ char words that appear 2+ times)
  const words = text.match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]{2,10}/g) || [];
  const freq = new Map<string, number>();

  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  const stopWords = new Set(['について', 'こちら', 'ページ', 'サイト', 'トップ', 'メニュー', 'ホーム', 'すべて', 'その他']);

  return Array.from(freq.entries())
    .filter(([word, count]) => count >= 2 && !stopWords.has(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}
