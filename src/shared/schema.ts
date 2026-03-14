/**
 * Publish Gate — Unified Analysis Schema
 *
 * Single source of truth for analysis output across dashboard, proxy, and extension.
 * Based on CLAUDE.md 4-step analysis pipeline:
 *   1. Company Understanding
 *   2. Page Reading
 *   3. Diagnosis (issues)
 *   4. Handoff Brief
 *
 * raw output  = Claude API JSON (unvalidated, may have missing/extra fields)
 * normalized  = validated AnalysisResult conforming to this schema
 */

import { z } from 'zod';
import { SCHEMA_VERSION } from './version';

// ---------- Enums / Literals ----------

export const ConfidenceLevel = z.enum(['high', 'medium', 'low']);
export const ImpactLevel = z.enum(['high', 'medium', 'low']);
export const HandoffTarget = z.enum(['designer', 'engineer', 'copywriter+designer', 'marketer']);
export const RiskLevel = z.enum(['high', 'medium', 'low']);
export const CTAProminence = z.enum(['primary', 'secondary', 'tertiary']);
export const AnalysisStatus = z.enum(['processing', 'completed', 'error']);

// ---------- Step 1: Company Understanding ----------

export const BrandToneSchema = z.object({
  sentence_endings: z.array(z.string()).default([]),
  uses_questions: z.boolean().default(false),
  tone_keywords: z.array(z.string()).default([]),
  example_phrases: z.array(z.string()).default([]),
});

export const CompanyUnderstandingSchema = z.object({
  summary: z.string().default(''),
  industry: z.string().default(''),
  business_model: z.string().default(''),
  brand_tone: BrandToneSchema.default(() => BrandToneSchema.parse({})),
  key_vocabulary: z.array(z.string()).default([]),
  credentials: z.array(z.string()).default([]),
  site_cta_structure: z.string().default(''),
});

// ---------- Step 2: Page Reading ----------

export const CTAInfoSchema = z.object({
  text: z.string().default(''),
  href: z.string().default(''),
  position: z.string().default(''),
  prominence: CTAProminence.default('secondary'),
});

export const PageReadingSchema = z.object({
  page_type: z.string().default(''),
  fv_main_copy: z.string().default(''),
  fv_sub_copy: z.string().default(''),
  cta_map: z.array(CTAInfoSchema).default([]),
  trust_elements: z.string().default(''),
  content_structure: z.string().default(''),
  confidence: ConfidenceLevel.default('medium'),
  screenshot_insights: z.string().default(''),
  dom_insights: z.string().default(''),
});

// ---------- Step 3-4: Issues + Brief ----------

export const HandoffBriefSchema = z.object({
  objective: z.string().default(''),
  direction: z.string().default(''),
  specifics: z.string().default(''),
  constraints: z.array(z.string()).default([]),
  qa_checklist: z.array(z.string()).default([]),
});

export const IssueSchema = z.object({
  priority: z.number().int().min(1).default(1),
  title: z.string().default(''),
  diagnosis: z.string().default(''),
  impact: ImpactLevel.default('medium'),
  handoff_to: HandoffTarget.default('designer'),
  brief: HandoffBriefSchema.default(() => HandoffBriefSchema.parse({})),
  evidence: z.string().default(''),
});

// ---------- Compliance ----------

export const RegulatoryRiskSchema = z.object({
  expression: z.string().default(''),
  risk_level: RiskLevel.default('medium'),
  reason: z.string().default(''),
  recommendation: z.string().default(''),
});

export const RegulatoryCheckSchema = z.object({
  yakujiho_risks: z.array(RegulatoryRiskSchema).default([]),
  keihinhyoujiho_risks: z.array(RegulatoryRiskSchema).default([]),
});

// ---------- Metadata ----------

export const AnalysisMetadataSchema = z.object({
  schema_version: z.string().default(SCHEMA_VERSION),
  analyzed_at: z.string().default(''),
  analysis_duration_ms: z.number().default(0),
  model_used: z.string().default(''),
  vision_used: z.boolean().default(false),
  dom_extracted: z.boolean().default(true),
  source: z.enum(['dashboard', 'proxy', 'extension']).default('dashboard'),
});

// ---------- Top-Level: AnalysisResult ----------

export const AnalysisResultSchema = z.object({
  company_understanding: CompanyUnderstandingSchema.default(() => CompanyUnderstandingSchema.parse({})),
  page_reading: PageReadingSchema.default(() => PageReadingSchema.parse({})),
  improvement_potential: z.string().default(''),
  issues: z.array(IssueSchema).default([]),
  regulatory: RegulatoryCheckSchema.optional(),
  metadata: AnalysisMetadataSchema.default(() => AnalysisMetadataSchema.parse({})),
});

// ---------- API Response Wrapper ----------

export const AnalyzeResponseSchema = z.object({
  id: z.string(),
  url: z.string(),
  status: AnalysisStatus,
  result: AnalysisResultSchema.optional(),
  error: z.string().optional(),
  created_at: z.string(),
});

// ---------- TypeScript Types (derived from Zod) ----------

export type BrandTone = z.infer<typeof BrandToneSchema>;
export type CompanyUnderstanding = z.infer<typeof CompanyUnderstandingSchema>;
export type CTAInfo = z.infer<typeof CTAInfoSchema>;
export type PageReading = z.infer<typeof PageReadingSchema>;
export type HandoffBrief = z.infer<typeof HandoffBriefSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type RegulatoryRisk = z.infer<typeof RegulatoryRiskSchema>;
export type RegulatoryCheck = z.infer<typeof RegulatoryCheckSchema>;
export type AnalysisMetadata = z.infer<typeof AnalysisMetadataSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
