/**
 * Publish Gate — Shared Analysis Schema
 *
 * Barrel export for all shared types, schemas, and utilities.
 * Import from '@shared' or '../../shared' depending on context.
 */

// Schema (Zod) + Types (inferred)
export {
  // Zod schemas
  AnalysisResultSchema,
  AnalyzeResponseSchema,
  AnalysisMetadataSchema,
  CompanyUnderstandingSchema,
  PageReadingSchema,
  CTAInfoSchema,
  IssueSchema,
  HandoffBriefSchema,
  RegulatoryCheckSchema,
  RegulatoryRiskSchema,
  BrandToneSchema,
  // Enum schemas
  ConfidenceLevel,
  ImpactLevel,
  HandoffTarget,
  RiskLevel,
  CTAProminence,
  AnalysisStatus,
  // Types
  type AnalysisResult,
  type AnalyzeResponse,
  type AnalysisMetadata,
  type CompanyUnderstanding,
  type PageReading,
  type CTAInfo,
  type Issue,
  type HandoffBrief,
  type RegulatoryCheck,
  type RegulatoryRisk,
  type BrandTone,
} from './schema';

// Normalization
export {
  normalizeAnalysisResult,
  normalizeProxyResult,
  extractJsonFromResponse,
} from './normalize';

// Version
export { SCHEMA_VERSION } from './version';
