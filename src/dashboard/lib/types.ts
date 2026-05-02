// Publish Gate - Core Types v4.0
// Based on v8-enriched demo (Phase 0 confirmed)

// ============================================================
// ANALYSIS REQUEST/RESPONSE
// ============================================================

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

// ============================================================
// ANALYSIS RESULT (4-Step Pipeline Output)
// ============================================================

export interface AnalysisResult {
  // Step 1: 企業理解
  company_understanding: CompanyUnderstanding;
  
  // Step 2: ページ読み取り
  page_reading: PageReading;
  
  // インサイト（提案の前に表示する総括）
  insight: string;
  
  // Step 3-4: 改善提案（3件）
  proposals: Proposal[];
  
  // 薬機法・景表法チェック
  regulatory?: RegulatoryCheck;
  
  // メタデータ
  metadata: AnalysisMetadata;
}

// ============================================================
// STEP 1: COMPANY UNDERSTANDING
// ============================================================

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

// ============================================================
// STEP 2: PAGE READING
// ============================================================

export interface PageReading {
  page_type: string;              // "BtoB SaaS 新規獲得LP"
  fv_main_copy: string;
  fv_sub_copy: string;
  primary_cta: string;            // "無料で始める"
  primary_cv: string;             // "無料トライアル申込"
  target_audience: string;        // "中小企業のPM・チームリーダー"
  evidence_data: string[];        // ページ内の実績データ ["残業30%削減", "利益率12%改善"]
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

// ============================================================
// STEP 3-4: PROPOSAL (CRITICAL - v8-enriched structure)
// ============================================================

export interface Proposal {
  id: number;
  
  // ヘッダー
  category: ProposalCategory;
  impact: 'high' | 'medium' | 'low';
  title: string;                  // Before→Afterを端的に表現
  
  // このページの文脈
  context: ProposalContext;
  
  // 根拠チェーン（4ステップ）★CRITICAL
  evidence_chain: EvidenceChain;
  
  // Before / After ★CRITICAL
  before_after: BeforeAfter;
  
  // 期待できる効果
  expected_impact: ExpectedImpact;
  
  // 注意点
  caution: string;
  
  // 依頼パック（デザイナー向け / エンジニア向け）
  briefs: {
    designer: DesignerBrief;
    engineer: EngineerBrief;
  };
}

export type ProposalCategory = 'trust' | 'cta' | 'structure' | 'copy';

export const CATEGORY_CONFIG: Record<ProposalCategory, { label: string; color: string; bgColor: string }> = {
  trust: { label: '信頼性', color: '#059669', bgColor: '#ECFDF5' },
  cta: { label: 'CTA', color: '#2563EB', bgColor: '#EFF6FF' },
  structure: { label: '構成', color: '#7C3AED', bgColor: '#F5F3FF' },
  copy: { label: 'コピー', color: '#D97706', bgColor: '#FFFBEB' },
};

export const IMPACT_CONFIG: Record<'high' | 'medium' | 'low', { label: string; color: string; bgColor: string }> = {
  high: { label: '影響 大', color: '#DC2626', bgColor: '#FEF2F2' },
  medium: { label: '影響 中', color: '#D97706', bgColor: '#FFFBEB' },
  low: { label: '影響 小', color: '#059669', bgColor: '#ECFDF5' },
};

// ============================================================
// PROPOSAL SUB-TYPES
// ============================================================

export interface ProposalContext {
  business_role: string;          // 事業における役割
  page_strengths: string[];       // このページの強み
  element_role: string;           // FV/CTAの本来の役割
}

// 根拠チェーン（4ステップ）★CRITICAL
export interface EvidenceChain {
  // 現状（観察結果）
  observation: EvidenceStep;
  // 業界傾向
  industry_trend: EvidenceStep;
  // ギャップ
  gap: EvidenceStep;
  // 仮説
  hypothesis: EvidenceStep;
}

export interface EvidenceStep {
  text: string;
  source: SourceTag;
}

// ソースタグ
export type SourceTag =
  | { type: 'fv_text' }
  | { type: 'page_structure' }
  | { type: 'section'; name: string }
  | { type: 'ai_knowledge' }
  | { type: 'estimate' };

export const SOURCE_TAG_CONFIG: Record<SourceTag['type'], { label: string; color: string; bgColor: string }> = {
  fv_text: { label: 'FVテキスト', color: '#2563EB', bgColor: '#EFF6FF' },
  page_structure: { label: 'ページ構造', color: '#2563EB', bgColor: '#EFF6FF' },
  section: { label: '', color: '#2563EB', bgColor: '#EFF6FF' }, // name is dynamic
  ai_knowledge: { label: 'AI知識ベース', color: '#7C3AED', bgColor: '#F5F3FF' },
  estimate: { label: '推定', color: '#64748B', bgColor: '#F1F5F9' },
};

export function getSourceTagLabel(tag: SourceTag): string {
  if (tag.type === 'section') {
    return tag.name;
  }
  return SOURCE_TAG_CONFIG[tag.type].label;
}

// Before / After ★CRITICAL
export interface BeforeAfter {
  before: string;
  after: string;
}

// 期待効果
export interface ExpectedImpact {
  primary_kpi: string;            // "FVからCTAへの到達率"
  improvement_range: string;      // "+30〜80%"
  confidence: 'high' | 'medium' | 'low';
  confidence_reason: string;      // "ページ内の実績データに基づく"
}

// ============================================================
// BRIEFS (DESIGNER / ENGINEER)
// ============================================================

export interface DesignerBrief {
  objective: string;              // 変更の目的
  changes: DesignerChange[];      // 変更内容
  checklist: string[];            // チェックリスト
}

export interface DesignerChange {
  target: string;                 // 対象
  before: string;
  after: string;
}

export interface EngineerBrief {
  changes: EngineerChange[];      // 変更箇所
  test_requirements: string[];    // テスト要件
}

export interface EngineerChange {
  selector: string;               // CSSセレクタ
  operation: 'update' | 'insert' | 'delete';
  before?: string;
  after: string;
}

// ============================================================
// REGULATORY CHECK
// ============================================================

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

// ============================================================
// METADATA
// ============================================================

export interface AnalysisMetadata {
  analyzed_at: string;
  analysis_duration_ms: number;
  model_used: string;
  vision_used: boolean;
  dom_extracted: boolean;
}

// ============================================================
// EXPERIMENT LOG (実験ノート - MOAT形成の中核)
// ============================================================

export interface ExperimentLog {
  id: string;
  page_url: string;
  created_at: string;
  
  // 自動記録（提案から自動引き継ぎ）
  auto_recorded: {
    category: ProposalCategory;
    before: string;
    after: string;
    proposal_id: number;
  };
  
  // ユーザー入力: 実行状況
  execution_status?: 'executed' | 'hold' | 'skipped';
  
  // ユーザー入力: 効果評価（1-5）
  // 1=大きく悪化, 2=やや悪化, 3=変化なし, 4=やや改善, 5=大きく改善
  effect_rating?: 1 | 2 | 3 | 4 | 5;
  
  // ユーザー入力: 数値の変化（任意）
  metrics?: {
    cvr?: { before: number; after: number };
    ctr?: { before: number; after: number };
    custom?: Array<{ name: string; before: number; after: number }>;
  };
}

export const EFFECT_RATING_CONFIG: Record<1 | 2 | 3 | 4 | 5, { label: string; color: string }> = {
  5: { label: '大きく改善', color: '#059669' },
  4: { label: 'やや改善', color: '#10B981' },
  3: { label: '変化なし', color: '#64748B' },
  2: { label: 'やや悪化', color: '#F59E0B' },
  1: { label: '大きく悪化', color: '#DC2626' },
};

export const EXECUTION_STATUS_CONFIG: Record<'executed' | 'hold' | 'skipped', { label: string; icon: string }> = {
  executed: { label: '実行した', icon: 'check' },
  hold: { label: '保留中', icon: 'pause' },
  skipped: { label: '見送り', icon: 'x' },
};

// ============================================================
// SHARE
// ============================================================

export interface ShareData {
  id: string;
  analysis_id: string;
  result: AnalysisResult;
  url: string;
  created_at: string;
}

// ============================================================
// PIPELINE INTERNAL TYPES
// ============================================================

export interface CompanyResearchResult {
  company_overview: string;
  brand_tone: BrandTone;
  key_vocabulary: string[];
  credentials: string[];
  case_studies: { title: string; summary: string }[];
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

// ============================================================
// PROGRESS
// ============================================================

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

// ============================================================
// UI TABS (Phase 0.5 = 2 tabs only)
// ============================================================

export interface TabConfig {
  id: number;
  name: string;
  description: string;
}

export const TABS: TabConfig[] = [
  { id: 1, name: '分析', description: 'ページ読み取り → 根拠チェーン → 依頼パック' },
  { id: 2, name: '実験ノート', description: '施策のBefore/After・数値変化を記録' },
];

// Future tabs (Phase 1+)
// { id: 3, name: '広告訴求', description: 'Google Ads RSA / Meta / PMax' },
// { id: 4, name: '市場分析', description: '流入クエリ / 検索ボリューム推移' },
// { id: 5, name: '流入分析', description: '参照元ランキング / 時系列推移' },
// { id: 6, name: '競合分析', description: '競合LP構造比較 / 訴求差別化' },
// { id: 7, name: '事業分析', description: '市場規模推定 / 事業モデル推定' },
