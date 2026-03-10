'use client';

import { useState } from 'react';
import type { Issue } from '../lib/types';
import BriefPanel from './BriefPanel';

interface IssueCardProps {
  issue: Issue;
}

const IMPACT_CONFIG = {
  high: {
    label: '高',
    className: 'bg-red-50 text-red-700 border border-red-200',
  },
  medium: {
    label: '中',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  low: {
    label: '低',
    className: 'bg-green-50 text-green-700 border border-green-200',
  },
} as const;

const HANDOFF_CONFIG: Record<Issue['handoff_to'], { label: string; className: string }> = {
  designer: {
    label: 'デザイナー',
    className: 'bg-purple-50 text-purple-700 border border-purple-200',
  },
  engineer: {
    label: 'エンジニア',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  'copywriter+designer': {
    label: 'コピーライター + デザイナー',
    className: 'bg-pink-50 text-pink-700 border border-pink-200',
  },
  marketer: {
    label: 'マーケター',
    className: 'bg-teal-50 text-teal-700 border border-teal-200',
  },
};

export default function IssueCard({ issue }: IssueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const impact = IMPACT_CONFIG[issue.impact];
  const handoff = HANDOFF_CONFIG[issue.handoff_to];

  return (
    <div
      className={`
        border rounded-xl bg-white transition-all duration-200
        ${isExpanded ? 'border-[#1B3A5C]/30 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
      `}
    >
      {/* Header - always visible */}
      <button
        className="w-full px-5 py-4 flex items-center gap-4 text-left cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={`issue-detail-${issue.priority}`}
      >
        {/* Priority number */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1B3A5C] text-white flex items-center justify-center text-sm font-bold">
          {issue.priority}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate font-['Noto_Sans_JP']">
            {issue.title}
          </h3>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium font-['Noto_Sans_JP'] ${impact.className}`}>
            影響: {impact.label}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium font-['Noto_Sans_JP'] ${handoff.className}`}>
            {handoff.label}
          </span>
        </div>

        {/* Chevron */}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable detail */}
      {isExpanded && (
        <div
          id={`issue-detail-${issue.priority}`}
          className="px-5 pb-5 border-t border-gray-100"
        >
          <div className="pt-4 space-y-5">
            {/* Diagnosis */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 font-['Noto_Sans_JP']">
                診断
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed font-['Noto_Sans_JP']">
                {issue.diagnosis}
              </p>
            </div>

            {/* Evidence */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 font-['Noto_Sans_JP']">
                根拠
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3 font-['Noto_Sans_JP']">
                {issue.evidence}
              </p>
            </div>

            {/* Handoff Brief */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 font-['Noto_Sans_JP']">
                改善ブリーフ
              </h4>
              <BriefPanel brief={issue.brief} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
