'use client';

import type { HandoffBrief } from '../lib/types';

interface BriefPanelProps {
  brief: HandoffBrief;
}

export default function BriefPanel({ brief }: BriefPanelProps) {
  return (
    <div className="border border-[#1B3A5C]/20 rounded-xl bg-gradient-to-br from-slate-50 to-white overflow-hidden">
      {/* Header bar */}
      <div className="bg-[#1B3A5C] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-semibold text-white font-['Noto_Sans_JP']">
            改善依頼ブリーフ
          </span>
        </div>
        <span className="text-[10px] text-white/60 font-['Noto_Sans_JP']">
          Powered by Publish Gate
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Objective */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1B3A5C]" />
            <h5 className="text-xs font-bold text-[#1B3A5C] uppercase tracking-wider font-['Noto_Sans_JP']">
              目的
            </h5>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed pl-4 font-['Noto_Sans_JP']">
            {brief.objective}
          </p>
        </section>

        {/* Direction */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1B3A5C]" />
            <h5 className="text-xs font-bold text-[#1B3A5C] uppercase tracking-wider font-['Noto_Sans_JP']">
              方向性
            </h5>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed pl-4 font-['Noto_Sans_JP']">
            {brief.direction}
          </p>
        </section>

        {/* Specifics */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1B3A5C]" />
            <h5 className="text-xs font-bold text-[#1B3A5C] uppercase tracking-wider font-['Noto_Sans_JP']">
              具体的な変更内容
            </h5>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed pl-4 font-['Noto_Sans_JP']">
            {brief.specifics}
          </p>
        </section>

        {/* Constraints */}
        {brief.constraints.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <h5 className="text-xs font-bold text-amber-700 uppercase tracking-wider font-['Noto_Sans_JP']">
                制約条件
              </h5>
            </div>
            <ul className="pl-4 space-y-1.5">
              {brief.constraints.map((constraint, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700 font-['Noto_Sans_JP']">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>{constraint}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* QA Checklist */}
        {brief.qa_checklist.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <h5 className="text-xs font-bold text-green-700 uppercase tracking-wider font-['Noto_Sans_JP']">
                QAチェックリスト
              </h5>
            </div>
            <ul className="pl-4 space-y-1.5">
              {brief.qa_checklist.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700 font-['Noto_Sans_JP']">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
