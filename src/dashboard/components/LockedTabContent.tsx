'use client';

import { TABS } from '../lib/types';

interface LockedTabContentProps {
  tabId: number;
}

const TAB_PREVIEWS: Record<number, {
  title: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  sampleMetrics?: { label: string; value: string }[];
}> = {
  3: {
    title: '市場分析',
    description: 'GSC連携で流入クエリ・検索ボリュームの推移を可視化。自社のポジションと成長機会を特定します。',
    features: [
      '流入クエリのランキングと推移',
      '検索ボリュームの季節変動分析',
      'キーワードギャップの自動検出',
      'コンテンツ機会の優先順位付け',
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    sampleMetrics: [
      { label: '主要キーワード', value: '---' },
      { label: '月間検索ボリューム', value: '---' },
      { label: '平均掲載順位', value: '---' },
    ],
  },
  4: {
    title: '流入分析',
    description: 'GA4連携で参照元ごとの流入量・コンバージョン率を時系列で表示。成果の出ているチャネルが一目でわかります。',
    features: [
      '参照元ランキング（直近30日/90日）',
      'チャネル別CVR比較',
      '時系列トレンドグラフ',
      '離脱ポイントの可視化',
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    sampleMetrics: [
      { label: '月間セッション', value: '---' },
      { label: '直帰率', value: '---' },
      { label: 'CVR', value: '---' },
    ],
  },
  5: {
    title: '競合分析',
    description: '競合LPの構造を自動比較し、訴求の差別化ポイントを特定。自社だけでは見えない改善機会を発見します。',
    features: [
      '競合LP構造の自動比較',
      '訴求軸のマッピング',
      'CTA配置パターンの差分',
      '差別化ポイントの自動抽出',
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    sampleMetrics: [
      { label: '比較対象', value: '最大3社' },
      { label: '訴求軸', value: '---' },
      { label: '差別化スコア', value: '---' },
    ],
  },
  6: {
    title: '事業分析',
    description: 'AI推定と業界データを組み合わせて、市場規模・事業モデルを推定。事業計画の土台データを自動生成します。',
    features: [
      'TAM/SAM/SOM市場規模推定',
      '事業モデルの構造分析',
      '競合ポジショニングマップ',
      '成長シナリオのシミュレーション',
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    sampleMetrics: [
      { label: '推定市場規模', value: '---' },
      { label: '成長率', value: '---' },
      { label: '参入障壁', value: '---' },
    ],
  },
};

const TIER_BADGE: Record<string, { label: string; color: string }> = {
  pro: { label: 'Pro', color: 'bg-purple-500 text-white' },
  business: { label: 'Business', color: 'bg-amber-500 text-white' },
};

export default function LockedTabContent({ tabId }: LockedTabContentProps) {
  const tab = TABS.find(t => t.id === tabId);
  const preview = TAB_PREVIEWS[tabId];

  if (!tab || !preview) return null;

  const badge = TIER_BADGE[tab.unlock_tier] || TIER_BADGE.pro;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Blurred preview area */}
      <div className="relative rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Sample metrics grid (blurred) */}
        <div className="p-6 filter blur-[2px] opacity-50 pointer-events-none select-none" aria-hidden="true">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {preview.sampleMetrics?.map((metric, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 mb-1">{metric.label}</div>
                <div className="text-2xl font-bold text-gray-300">{metric.value}</div>
              </div>
            ))}
          </div>
          {/* Placeholder chart area */}
          <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="flex gap-1 items-end">
              {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                <div key={i} className="w-6 bg-gray-200 rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Overlay CTA */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="text-center max-w-md px-6">
            <div className="w-14 h-14 rounded-2xl bg-[#1B3A5C]/10 flex items-center justify-center text-[#1B3A5C] mx-auto mb-4">
              {preview.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{preview.title}</h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{preview.description}</p>

            <ul className="text-left text-sm text-gray-700 space-y-2 mb-6">
              {preview.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#1B3A5C] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B3A5C] text-white rounded-lg text-sm font-medium hover:bg-[#2a5a8c] transition-colors"
              onClick={() => {
                // TODO: Navigate to pricing page or open billing modal
              }}
            >
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${badge.color}`}>
                {badge.label}
              </span>
              プランで利用する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
