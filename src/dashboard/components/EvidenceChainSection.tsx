'use client';

import type { EvidenceChain } from '@/lib/types';
import SourceTag from './SourceTag';

interface Props {
  chain: EvidenceChain;
}

const STEP_CONFIG = {
  observation: {
    label: '現状',
    color: '#64748B',
  },
  industry_trend: {
    label: '業界傾向',
    color: '#7C3AED',
  },
  gap: {
    label: 'ギャップ',
    color: '#F59E0B',
  },
  hypothesis: {
    label: '仮説',
    color: '#2563EB',
  },
} as const;

const STEP_ICONS: Record<string, React.ReactNode> = {
  observation: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  industry_trend: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  gap: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  hypothesis: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
};

export default function EvidenceChainSection({ chain }: Props) {
  return (
    <section className="mb-5">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        根拠チェーン
      </h4>
      <div className="space-y-3">
        {(['observation', 'industry_trend', 'gap', 'hypothesis'] as const).map((key) => {
          const step = chain[key];
          const config = STEP_CONFIG[key];
          return (
            <div key={key} className="flex gap-3">
              <div
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${config.color}20`, color: config.color }}
              >
                {STEP_ICONS[key]}
              </div>
              <div className="flex-1">
                <div
                  className="text-xs font-bold mb-1"
                  style={{ color: config.color }}
                >
                  {config.label}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {step.text}
                  <SourceTag tag={step.source} />
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
