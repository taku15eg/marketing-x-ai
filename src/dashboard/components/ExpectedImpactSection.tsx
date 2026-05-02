'use client';

import type { ExpectedImpact } from '@/lib/types';

interface Props {
  impact: ExpectedImpact;
}

const CONFIDENCE_CONFIG = {
  high: { label: '高', className: 'bg-green-100 text-green-700' },
  medium: { label: '中', className: 'bg-amber-100 text-amber-700' },
  low: { label: '低', className: 'bg-gray-100 text-gray-600' },
} as const;

export default function ExpectedImpactSection({ impact }: Props) {
  const confidence = CONFIDENCE_CONFIG[impact.confidence];

  return (
    <section className="mb-5">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        期待できる効果
      </h4>
      <div className="bg-blue-50/50 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">主なKPI:</span>
          <span className="text-sm font-medium text-gray-900">{impact.primary_kpi}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">改善幅:</span>
          <span className="text-sm font-bold text-[#2563EB]">{impact.improvement_range}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">確からしさ:</span>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${confidence.className}`}>
            {confidence.label}
          </span>
          <span className="text-xs text-gray-500">{impact.confidence_reason}</span>
        </div>
      </div>
    </section>
  );
}
