'use client';

import { useState } from 'react';
import type { DesignerBrief, EngineerBrief } from '@/lib/types';

interface Props {
  briefs: {
    designer: DesignerBrief;
    engineer: EngineerBrief;
  };
}

export default function BriefTabs({ briefs }: Props) {
  const [activeTab, setActiveTab] = useState<'designer' | 'engineer'>('designer');

  return (
    <section>
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        依頼パック
      </h4>

      {/* タブ */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setActiveTab('designer')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === 'designer'
              ? 'bg-[#2563EB] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          デザイナー向け
        </button>
        <button
          onClick={() => setActiveTab('engineer')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === 'engineer'
              ? 'bg-[#2563EB] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          エンジニア向け
        </button>
      </div>

      {/* コンテンツ */}
      <div className="border border-[#2563EB]/20 rounded-xl bg-gradient-to-br from-slate-50 to-white overflow-hidden">
        <div className="bg-[#2563EB] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-semibold text-white">
              {activeTab === 'designer' ? 'デザイナー向け依頼書' : 'エンジニア向け依頼書'}
            </span>
          </div>
          <span className="text-[10px] text-white/60">
            Powered by Publish Gate
          </span>
        </div>

        <div className="p-5">
          {activeTab === 'designer' ? (
            <DesignerBriefContent brief={briefs.designer} />
          ) : (
            <EngineerBriefContent brief={briefs.engineer} />
          )}
        </div>
      </div>
    </section>
  );
}

function BriefSection({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-5 h-5 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-xs font-bold flex items-center justify-center">
          {number}
        </span>
        <h5 className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">
          {title}
        </h5>
      </div>
      {children}
    </div>
  );
}

function DesignerBriefContent({ brief }: { brief: DesignerBrief }) {
  return (
    <div className="space-y-4">
      <BriefSection number={1} title="変更の目的">
        <p className="text-sm text-gray-800 pl-7">{brief.objective}</p>
      </BriefSection>

      <BriefSection number={2} title="変更内容">
        <div className="pl-7">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left font-medium text-gray-600">対象</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Before</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">After</th>
              </tr>
            </thead>
            <tbody>
              {brief.changes.map((change, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-gray-700">{change.target}</td>
                  <td className="px-3 py-2 text-gray-500">{change.before}</td>
                  <td className="px-3 py-2 text-gray-900 font-medium">{change.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BriefSection>

      <BriefSection number={3} title="チェックリスト">
        <ul className="pl-7 space-y-2">
          {brief.checklist.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </BriefSection>
    </div>
  );
}

function EngineerBriefContent({ brief }: { brief: EngineerBrief }) {
  return (
    <div className="space-y-4">
      <BriefSection number={1} title="変更箇所">
        <div className="pl-7">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left font-medium text-gray-600">セレクタ</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">操作</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">内容</th>
              </tr>
            </thead>
            <tbody>
              {brief.changes.map((change, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-3 py-2">
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono text-gray-700">
                      {change.selector}
                    </code>
                  </td>
                  <td className="px-3 py-2 text-gray-600 capitalize">{change.operation}</td>
                  <td className="px-3 py-2 text-gray-900">{change.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BriefSection>

      <BriefSection number={2} title="テスト要件">
        <ul className="pl-7 space-y-2">
          {brief.test_requirements.map((req, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{req}</span>
            </li>
          ))}
        </ul>
      </BriefSection>
    </div>
  );
}
