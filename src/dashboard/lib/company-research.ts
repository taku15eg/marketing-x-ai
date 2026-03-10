// Step 1: Company Research
// Fetches and understands the company behind the URL

import { fetchWithSSRFProtection } from './url-validator';
import { stripHtml as sharedStripHtml } from './html-utils';
import type { CompanyResearchResult, BrandTone } from './types';

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

  return {
    company_overview: `${companyName}。${descMatch?.[1] || ''}`.trim(),
    brand_tone: brandTone,
    key_vocabulary: keyVocabulary,
    credentials,
    case_studies: [],
  };
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
