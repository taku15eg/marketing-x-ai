'use client';

import type { AnalysisResult as AnalysisResultType, RegulatoryRisk } from '../lib/types';
import IssueCard from './IssueCard';
import PoweredByBadge from './PoweredByBadge';

interface AnalysisResultProps {
  result: AnalysisResultType;
}

const RISK_LEVEL_CONFIG = {
  high: {
    label: '高リスク',
    className: 'bg-red-50 border-red-200 text-red-800',
    dotClassName: 'bg-red-500',
  },
  medium: {
    label: '中リスク',
    className: 'bg-amber-50 border-amber-200 text-amber-800',
    dotClassName: 'bg-amber-500',
  },
  low: {
    label: '低リスク',
    className: 'bg-green-50 border-green-200 text-green-800',
    dotClassName: 'bg-green-500',
  },
} as const;

const SEVERITY_CONFIG = {
  prohibited: {
    label: '禁止表現',
    className: 'bg-red-600 text-white',
  },
  caution: {
    label: '要注意',
    className: 'bg-amber-500 text-white',
  },
  review_recommended: {
    label: '要確認',
    className: 'bg-blue-500 text-white',
  },
} as const;

const SOURCE_CONFIG = {
  rule: { label: 'ルール検出', className: 'bg-purple-100 text-purple-700' },
  llm: { label: 'AI検出', className: 'bg-blue-100 text-blue-700' },
  both: { label: 'ルール+AI検出', className: 'bg-indigo-100 text-indigo-700' },
} as const;

function RegulatoryWarningItem({ risk }: { risk: RegulatoryRisk }) {
  const config = RISK_LEVEL_CONFIG[risk.risk_level];
  const severityConfig = risk.severity ? SEVERITY_CONFIG[risk.severity] : null;
  const sourceConfig = risk.source ? SOURCE_CONFIG[risk.source] : null;

  return (
    <div className={`p-4 rounded-lg border ${config.className}`}>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <div className={`w-2 h-2 rounded-full ${config.dotClassName}`} />
        <span className="text-xs font-bold">{config.label}</span>
        {severityConfig && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${severityConfig.className}`}>
            {severityConfig.label}
          </span>
        )}
        {sourceConfig && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${sourceConfig.className}`}>
            {sourceConfig.label}
          </span>
        )}
        {risk.human_review_required && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">
            要専門家確認
          </span>
        )}
      </div>
      {risk.category && (
        <p className="text-[11px] text-gray-500 mb-1">{risk.category}</p>
      )}
      <p className="text-sm font-medium mb-1">
        {risk.expression}
      </p>
      <p className="text-xs leading-relaxed mb-2">
        {risk.reason}
      </p>
      {risk.llm_reason && risk.llm_reason !== risk.reason && (
        <p className="text-xs leading-relaxed mb-2 pl-3 border-l-2 border-blue-300">
          <span className="text-blue-600 font-medium">AI補足: </span>{risk.llm_reason}
        </p>
      )}
      <p className="text-xs">
        <span className="font-semibold">推奨対応:</span> {risk.recommendation}
      </p>
      {risk.llm_recommendation && risk.llm_recommendation !== risk.recommendation && (
        <p className="text-xs mt-1 pl-3 border-l-2 border-blue-300">
          <span className="text-blue-600 font-medium">AI推奨: </span>{risk.llm_recommendation}
        </p>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#1B3A5C]/10 flex items-center justify-center text-[#1B3A5C]">
          {icon}
        </div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      <div className="text-sm text-gray-700 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export default function AnalysisResult({ result }: AnalysisResultProps) {
  const hasRegulatoryWarnings =
    result.regulatory &&
    (result.regulatory.yakujiho_risks.length > 0 ||
      result.regulatory.keihinhyoujiho_risks.length > 0);

  const preCheckSummary = result.regulatory?.pre_check_summary;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Improvement Potential Banner */}
      <div className="bg-gradient-to-r from-[#1B3A5C] to-[#2a5a8c] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">改善ポテンシャル</h2>
            <p className="text-white/80 text-sm mt-1">
              分析に基づく推定改善幅
            </p>
          </div>
          <div className="text-4xl font-bold">{result.improvement_potential}</div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Company Understanding */}
        <SummaryCard
          title="企業理解"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        >
          <p className="mb-2">{result.company_understanding.summary}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
              {result.company_understanding.industry}
            </span>
            <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
              {result.company_understanding.business_model}
            </span>
          </div>
        </SummaryCard>

        {/* Page Reading */}
        <SummaryCard
          title="ページ読取"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        >
          <div className="space-y-2">
            <div>
              <span className="text-xs text-gray-500">ページタイプ: </span>
              <span className="text-xs font-medium">{result.page_reading.page_type}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500">メインコピー: </span>
              <span className="text-xs">{result.page_reading.fv_main_copy}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500">信頼性: </span>
              <span className={`
                text-xs font-medium px-1.5 py-0.5 rounded
                ${result.page_reading.confidence === 'high'
                  ? 'bg-green-100 text-green-700'
                  : result.page_reading.confidence === 'medium'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                }
              `}>
                {result.page_reading.confidence === 'high' ? '高' : result.page_reading.confidence === 'medium' ? '中' : '低'}
              </span>
            </div>
          </div>
        </SummaryCard>

        {/* Content Structure */}
        <SummaryCard
          title="コンテンツ構造"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          }
        >
          <p>{result.page_reading.content_structure}</p>
          <div className="mt-3">
            <span className="text-xs text-gray-500">CTA数: </span>
            <span className="text-xs font-medium">{result.page_reading.cta_map.length}</span>
          </div>
        </SummaryCard>
      </div>

      {/* Regulatory Warnings */}
      {hasRegulatoryWarnings && (
        <div className="bg-white border border-red-200 rounded-xl overflow-hidden">
          <div className="bg-red-50 px-5 py-3 border-b border-red-200 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-base font-bold text-red-800">
              法規制リスク
            </h3>
            {preCheckSummary && preCheckSummary.total_prohibited > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 bg-red-600 text-white rounded-full font-medium">
                禁止表現 {preCheckSummary.total_prohibited}件
              </span>
            )}
          </div>

          {/* Pre-check summary bar */}
          {preCheckSummary && (preCheckSummary.total_prohibited > 0 || preCheckSummary.total_caution > 0 || preCheckSummary.total_review > 0) && (
            <div className="px-5 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-3 text-xs">
              <span className="text-gray-500 font-medium">ルール一次チェック:</span>
              {preCheckSummary.total_prohibited > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                  禁止 {preCheckSummary.total_prohibited}
                </span>
              )}
              {preCheckSummary.total_caution > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                  要注意 {preCheckSummary.total_caution}
                </span>
              )}
              {preCheckSummary.total_review > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                  要確認 {preCheckSummary.total_review}
                </span>
              )}
            </div>
          )}

          <div className="p-5 space-y-6">
            {result.regulatory!.yakujiho_risks.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">薬機法</span>
                  リスク項目
                </h4>
                <div className="space-y-3">
                  {result.regulatory!.yakujiho_risks.map((risk, index) => (
                    <RegulatoryWarningItem key={`yakujiho-${index}`} risk={risk} />
                  ))}
                </div>
              </div>
            )}

            {result.regulatory!.keihinhyoujiho_risks.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">景品表示法</span>
                  リスク項目
                </h4>
                <div className="space-y-3">
                  {result.regulatory!.keihinhyoujiho_risks.map((risk, index) => (
                    <RegulatoryWarningItem key={`keihin-${index}`} risk={risk} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          {result.regulatory!.disclaimer && (
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-[11px] text-gray-500 leading-relaxed">
                {result.regulatory!.disclaimer}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Issues List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            改善課題
          </h2>
          <span className="text-sm text-gray-500">
            {result.issues.length}件の課題
          </span>
        </div>
        <div className="space-y-3">
          {result.issues
            .sort((a, b) => a.priority - b.priority)
            .map((issue) => (
              <IssueCard key={issue.priority} issue={issue} />
            ))}
        </div>
      </div>

      {/* Analysis Metadata */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>分析日時: {new Date(result.metadata.analyzed_at).toLocaleString('ja-JP')}</span>
          <span>処理時間: {(result.metadata.analysis_duration_ms / 1000).toFixed(1)}秒</span>
          {result.metadata.vision_used && (
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">Vision API使用</span>
          )}
          {result.metadata.compliance_pre_check_used && (
            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">ルールチェック併用</span>
          )}
        </div>
        <PoweredByBadge />
      </div>
    </div>
  );
}
