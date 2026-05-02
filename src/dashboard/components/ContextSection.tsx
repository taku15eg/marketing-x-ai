'use client';

import type { ProposalContext } from '@/lib/types';

interface Props {
  context: ProposalContext;
}

export default function ContextSection({ context }: Props) {
  return (
    <section className="mb-5">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        このページの文脈
      </h4>
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div>
          <span className="text-xs text-gray-500">事業における役割: </span>
          <span className="text-sm text-gray-800">{context.business_role}</span>
        </div>
        {context.page_strengths.length > 0 && (
          <div>
            <span className="text-xs text-gray-500">このページの強み: </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {context.page_strengths.map((strength, i) => (
                <span key={i} className="inline-block px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                  {strength}
                </span>
              ))}
            </div>
          </div>
        )}
        <div>
          <span className="text-xs text-gray-500">本来の役割: </span>
          <span className="text-sm text-gray-800">{context.element_role}</span>
        </div>
      </div>
    </section>
  );
}
