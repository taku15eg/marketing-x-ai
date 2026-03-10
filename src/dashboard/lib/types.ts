// Publish Gate - Core Types

// === Analysis Request/Response ===

export interface AnalyzeRequest {
  url: string;
}

export interface AnalyzeResponse {
  id: string;
  url: string;
  status: 'processing' | 'completed' | 'error';
  result?: AnalysisResult;
  error?: string;
  created_at: string;
}

// === 4-Step Analysis Pipeline Output ===

export interface AnalysisResult {
  company_understanding: CompanyUnderstanding;
  page_reading: PageReading;
  improvement_potential: string;
  issues: Issue[];
  regulatory?: RegulatoryCheck;
  metadata: AnalysisMetadata;
}

export interface CompanyUnderstanding {
  summary: string;
  industry: string;
  business_model: string;
  brand_tone: BrandTone;
  key_vocabulary: string[];
  credentials: string[];
  site_cta_structure: string;
}

export interface BrandTone {
  sentence_endings: string[];
  uses_questions: boolean;
  tone_keywords: string[];
  example_phrases: string[];
}

export interface PageReading {
  page_type: string;
  fv_main_copy: string;
  fv_sub_copy: string;
  cta_map: CTAInfo[];
  trust_elements: string;
  content_structure: string;
  confidence: 'high' | 'medium' | 'low';
  screenshot_insights: string;
  dom_insights: string;
}

export interface CTAInfo {
  text: string;
  href: string;
  position: string;
  prominence: 'primary' | 'secondary' | 'tertiary';
}

export interface Issue {
  priority: number;
  title: string;
  diagnosis: string;
  impact: 'high' | 'medium' | 'low';
  handoff_to: 'designer' | 'engineer' | 'copywriter+designer' | 'marketer';
  brief: HandoffBrief;
  evidence: string;
}

export interface HandoffBrief {
  objective: string;
  direction: string;
  specifics: string;
  constraints: string[];
  qa_checklist: string[];
}

export interface RegulatoryCheck {
  yakujiho_risks: RegulatoryRisk[];
  keihinhyoujiho_risks: RegulatoryRisk[];
}

export interface RegulatoryRisk {
  expression: string;
  risk_level: 'high' | 'medium' | 'low';
  reason: string;
  recommendation: string;
}

export interface AnalysisMetadata {
  analyzed_at: string;
  analysis_duration_ms: number;
  model_used: string;
  vision_used: boolean;
  dom_extracted: boolean;
}

// === Share ===

export interface ShareData {
  id: string;
  analysis_id: string;
  result: AnalysisResult;
  url: string;
  created_at: string;
}

// === Pipeline Steps ===

export interface CompanyResearchResult {
  company_overview: string;
  brand_tone: BrandTone;
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
