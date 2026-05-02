'use client';

import { useState } from 'react';
import type { Proposal } from '../lib/types';
import { CATEGORY_CONFIG, IMPACT_CONFIG } from '../lib/types';
import ContextSection from './ContextSection';
import EvidenceChainSection from './EvidenceChainSection';
import BeforeAfterSection from './BeforeAfterSection';
import ExpectedImpactSection from './ExpectedImpactSection';
import BriefTabs from './BriefTabs';

interface ProposalCardProps {
  proposal: Proposal;
}

export default function ProposalCard({ proposal }: ProposalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const category = CATEGORY_CONFIG[proposal.category];
  const impact = IMPACT_CONFIG[proposal.impact];

  return (
    <div
      className={`
        border rounded-xl bg-white transition-all duration-200
        ${isExpanded ? 'border-[#2563EB]/30 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
      `}
    >
      {/* Header - always visible */}
      <button
        className="w-full px-5 py-4 flex items-center gap-4 text-left cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={`proposal-detail-${proposal.id}`}
      >
        {/* Arrow */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        {/* Meta badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: category.bgColor, color: category.color }}
          >
            {category.label}
          </span>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: impact.bgColor, color: impact.color }}
          >
            {impact.label}
          </span>
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">
            {proposal.title}
          </h3>
        </div>
      </button>

      {/* Expandable detail */}
      {isExpanded && (
        <div
          id={`proposal-detail-${proposal.id}`}
          className="px-5 pb-5 border-t border-gray-100"
        >
          <div className="pt-4 space-y-1">
            {/* このページの文脈 */}
            <ContextSection context={proposal.context} />

            {/* 根拠チェーン（4ステップ）*/}
            <EvidenceChainSection chain={proposal.evidence_chain} />

            {/* Before / After */}
            <BeforeAfterSection beforeAfter={proposal.before_after} />

            {/* 期待できる効果 */}
            <ExpectedImpactSection impact={proposal.expected_impact} />

            {/* 注意点 */}
            {proposal.caution && (
              <section className="mb-5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  注意点
                </h4>
                <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                  {proposal.caution}
                </p>
              </section>
            )}

            {/* 依頼パック（タブ切り替え）*/}
            <BriefTabs briefs={proposal.briefs} />
          </div>
        </div>
      )}
    </div>
  );
}
