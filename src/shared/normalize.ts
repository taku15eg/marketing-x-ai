/**
 * Publish Gate — Raw → Normalized Transformation Layer
 *
 * Converts unvalidated AI model output (raw JSON) into a validated AnalysisResult.
 * Handles:
 *   - Missing fields (defaults applied via Zod)
 *   - Extra fields (stripped)
 *   - Model output variations (field name typos, structural differences)
 *   - Proxy format (goal_card/proposals) → canonical format
 */

import {
  AnalysisResultSchema,
  IssueSchema,
  RegulatoryCheckSchema,
  type AnalysisResult,
  type Issue,
} from './schema';
import { SCHEMA_VERSION } from './version';

/**
 * Normalize raw Claude API output into a validated AnalysisResult.
 * This is the primary entry point for dashboard and extension.
 *
 * @param raw - Parsed JSON from Claude API (may be incomplete/malformed)
 * @param defaults - Partial metadata defaults (source, model_used, etc.)
 * @returns Validated AnalysisResult
 * @throws Error if the raw data is fundamentally unparseable
 */
export function normalizeAnalysisResult(
  raw: Record<string, unknown>,
  defaults?: Partial<{
    source: 'dashboard' | 'proxy' | 'extension';
    model_used: string;
    vision_used: boolean;
    dom_extracted: boolean;
    analyzed_at: string;
  }>
): AnalysisResult {
  // Pre-process issues to ensure priority assignment
  const rawIssues = Array.isArray(raw.issues) ? raw.issues : [];
  const issues = rawIssues.map((issue: Record<string, unknown>, index: number) => {
    const normalized: Record<string, unknown> = { ...issue };
    if (typeof normalized.priority !== 'number') {
      normalized.priority = index + 1;
    }
    // Normalize brief sub-object
    if (normalized.brief && typeof normalized.brief === 'object') {
      const brief = normalized.brief as Record<string, unknown>;
      normalized.brief = {
        objective: brief.objective ?? '',
        direction: brief.direction ?? '',
        specifics: brief.specifics ?? '',
        constraints: Array.isArray(brief.constraints) ? brief.constraints : [],
        qa_checklist: Array.isArray(brief.qa_checklist) ? brief.qa_checklist : [],
      };
    }
    return normalized;
  });

  // Pre-process regulatory to filter empty arrays
  let regulatory: Record<string, unknown> | undefined;
  if (raw.regulatory && typeof raw.regulatory === 'object') {
    const reg = raw.regulatory as Record<string, unknown>;
    const yakujiho = Array.isArray(reg.yakujiho_risks) ? reg.yakujiho_risks : [];
    const keihin = Array.isArray(reg.keihinhyoujiho_risks) ? reg.keihinhyoujiho_risks : [];
    if (yakujiho.length > 0 || keihin.length > 0) {
      regulatory = { yakujiho_risks: yakujiho, keihinhyoujiho_risks: keihin };
    }
  }

  // Build the input object for Zod parsing
  const input: Record<string, unknown> = {
    company_understanding: raw.company_understanding ?? {},
    page_reading: raw.page_reading ?? {},
    improvement_potential: raw.improvement_potential ?? '',
    issues,
    metadata: {
      schema_version: SCHEMA_VERSION,
      analyzed_at: defaults?.analyzed_at ?? new Date().toISOString(),
      analysis_duration_ms: 0,
      model_used: defaults?.model_used ?? '',
      vision_used: defaults?.vision_used ?? false,
      dom_extracted: defaults?.dom_extracted ?? true,
      source: defaults?.source ?? 'dashboard',
    },
  };

  if (regulatory) {
    input.regulatory = regulatory;
  }

  // Parse with Zod — applies defaults, strips unknown fields, validates types
  const result = AnalysisResultSchema.parse(input);

  // Sort issues by priority
  result.issues.sort((a, b) => a.priority - b.priority);

  return result;
}

/**
 * Normalize proxy format (goal_card/proposals/judgment) into canonical AnalysisResult.
 * The proxy uses a different AI prompt that produces a different structure.
 *
 * Mapping:
 *   goal_card.company_hypothesis → company_understanding.summary
 *   goal_card.page_role → page_reading.page_type
 *   goal_card.primary_cv → page_reading.fv_main_copy
 *   goal_card.confidence → page_reading.confidence
 *   proposals[] → issues[]
 *   judgment → metadata extension
 */
export function normalizeProxyResult(
  raw: Record<string, unknown>,
  url: string
): AnalysisResult {
  const goalCard = (raw.goal_card ?? {}) as Record<string, unknown>;
  const proposals = Array.isArray(raw.proposals) ? raw.proposals : [];
  const judgment = (raw.judgment as string) ?? '';

  const issues: Issue[] = proposals.map(
    (p: Record<string, unknown>, index: number) =>
      IssueSchema.parse({
        priority: (p.priority as number) ?? index + 1,
        title: p.title ?? '',
        diagnosis: `${p.before ?? ''} → ${p.after ?? ''}`,
        impact: p.confidence === 'high' ? 'high' : p.confidence === 'low' ? 'low' : 'medium',
        handoff_to: mapProposalCategoryToHandoff(p.category as string),
        brief: {
          objective: p.title ?? '',
          direction: p.after ?? '',
          specifics: p.evidence ?? '',
          constraints: p.risk ? [p.risk as string] : [],
          qa_checklist: [],
        },
        evidence: p.evidence ?? '',
      })
  );

  return AnalysisResultSchema.parse({
    company_understanding: {
      summary: goalCard.company_hypothesis ?? '',
      industry: '',
      business_model: '',
      site_cta_structure: goalCard.primary_cv ?? '',
    },
    page_reading: {
      page_type: goalCard.page_role ?? '',
      fv_main_copy: goalCard.primary_cv ?? '',
      fv_sub_copy: goalCard.secondary_cv ?? '',
      confidence: goalCard.confidence ?? 'medium',
    },
    improvement_potential: judgment === 'FAIL' ? 'High' : judgment === 'HOLD' ? 'Medium' : 'Low',
    issues,
    metadata: {
      schema_version: SCHEMA_VERSION,
      analyzed_at: new Date().toISOString(),
      model_used: 'claude-sonnet-4-6',
      source: 'proxy',
    },
  });
}

function mapProposalCategoryToHandoff(
  category: string | undefined
): 'designer' | 'engineer' | 'copywriter+designer' | 'marketer' {
  switch (category) {
    case 'copy':
      return 'copywriter+designer';
    case 'cta':
    case 'layout':
    case 'trust':
      return 'designer';
    case 'speed':
    case 'seo':
      return 'engineer';
    default:
      return 'designer';
  }
}

/**
 * Extract JSON from Claude response text.
 * Handles markdown code blocks: ```json ... ``` or ``` ... ```
 */
export function extractJsonFromResponse(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  return text.trim();
}
