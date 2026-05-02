'use client';

import type { BeforeAfter } from '@/lib/types';

interface Props {
  beforeAfter: BeforeAfter;
}

export default function BeforeAfterSection({ beforeAfter }: Props) {
  return (
    <section className="mb-5">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        Before / After
      </h4>
      <div className="space-y-2">
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-bold rounded flex-shrink-0">
            Before
          </span>
          <p className="text-sm text-gray-600 bg-red-50/50 rounded px-3 py-2 flex-1">
            {beforeAfter.before}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded flex-shrink-0">
            After
          </span>
          <p className="text-sm text-gray-700 bg-green-50/50 rounded px-3 py-2 flex-1">
            {beforeAfter.after}
          </p>
        </div>
      </div>
    </section>
  );
}
