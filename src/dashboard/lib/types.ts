// Publish Gate - Core Types
// Re-exported from shared schema (single source of truth)

export type {
  AnalysisResult,
  AnalyzeResponse,
  AnalysisMetadata,
  CompanyUnderstanding,
  PageReading,
  CTAInfo,
  Issue,
  HandoffBrief,
  RegulatoryCheck,
  RegulatoryRisk,
  BrandTone,
} from '../../shared/schema';

// === Analysis Request ===

export interface AnalyzeRequest {
  url: string;
}

// === Pipeline Steps (dashboard-specific input types) ===

export interface CompanyResearchResult {
  company_overview: string;
  brand_tone: {
    sentence_endings: string[];
    uses_questions: boolean;
    tone_keywords: string[];
    example_phrases: string[];
  };
  key_vocabulary: string[];
  credentials: string[];
  case_studies: { title: string; summary: string }[];
}

export interface PageReadingInput {
  url: string;
  screenshot_base64?: string;
  dom_data: DOMData;
}

export interface DOMData {
  title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  og_image: string;
  canonical: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  ctas: CTAInfo[];
  images: { alt: string; width: number; height: number }[];
  text_content: string;
  word_count: number;
  link_count: number;
}

// === Progress ===

export type AnalysisStep =
  | 'company_research'
  | 'page_reading'
  | 'diagnosis'
  | 'brief_generation';

export interface AnalysisProgress {
  current_step: AnalysisStep;
  step_number: number;
  total_steps: 4;
  message: string;
}

// === Tab System ===

export interface TabConfig {
  id: number;
  name: string;
  locked: boolean;
  unlock_tier: 'free' | 'starter' | 'pro' | 'business';
  description: string;
}

export const TABS: TabConfig[] = [
  { id: 1, name: 'LP分析', locked: false, unlock_tier: 'free', description: '課題→詳細→依頼書→薬機法→計測設計' },
  { id: 2, name: '広告訴求', locked: true, unlock_tier: 'starter', description: 'Google Ads RSA / Meta / PMax' },
  { id: 3, name: '市場分析', locked: true, unlock_tier: 'pro', description: '流入クエリ / 検索ボリューム推移' },
  { id: 4, name: '流入分析', locked: true, unlock_tier: 'pro', description: '参照元ランキング / 時系列推移' },
  { id: 5, name: '競合分析', locked: true, unlock_tier: 'pro', description: '競合LP構造比較 / 訴求差別化' },
  { id: 6, name: '事業分析', locked: true, unlock_tier: 'business', description: '市場規模推定 / 事業モデル推定' },
];

// Re-export CTAInfo type imported above for DOMData usage
import type { CTAInfo } from '../../shared/schema';
