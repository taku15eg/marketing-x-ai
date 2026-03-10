'use client';

import { useState } from 'react';
import { TABS, type TabConfig } from '../lib/types';

interface TabNavigationProps {
  activeTab: number;
  onTabChange?: (tabId: number) => void;
}

const TIER_LABELS: Record<TabConfig['unlock_tier'], string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
};

const TIER_COLORS: Record<TabConfig['unlock_tier'], string> = {
  free: 'bg-green-100 text-green-700',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  business: 'bg-amber-100 text-amber-700',
};

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);

  return (
    <div className="w-full border-b border-gray-200 bg-white">
      <nav className="flex" role="tablist" aria-label="分析タブ">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const isLocked = tab.locked;

          return (
            <div key={tab.id} className="relative">
              <button
                role="tab"
                aria-selected={isActive}
                aria-disabled={isLocked}
                className={`
                  relative px-6 py-3.5 text-sm font-medium transition-all duration-200
                  font-['Noto_Sans_JP'] flex items-center gap-1.5
                  ${isActive
                    ? 'text-[#1B3A5C] border-b-2 border-[#1B3A5C]'
                    : isLocked
                      ? 'text-gray-400 cursor-default'
                      : 'text-gray-500 hover:text-[#1B3A5C] hover:bg-gray-50 cursor-pointer'
                  }
                `}
                onClick={() => {
                  if (!isLocked && onTabChange) {
                    onTabChange(tab.id);
                  }
                }}
                onMouseEnter={() => isLocked && setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                <span>{tab.name}</span>
                {isLocked && (
                  <svg
                    className="w-3.5 h-3.5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                )}
              </button>

              {/* Tooltip for locked tabs */}
              {isLocked && hoveredTab === tab.id && (
                <div
                  className="
                    absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50
                    bg-gray-900 text-white text-xs rounded-lg px-4 py-3 whitespace-nowrap
                    shadow-xl font-['Noto_Sans_JP']
                  "
                  role="tooltip"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="font-medium">{tab.description}</span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${TIER_COLORS[tab.unlock_tier]}`}
                      >
                        {TIER_LABELS[tab.unlock_tier]}
                      </span>
                      <span className="text-gray-300">プラン以上で利用可能</span>
                    </span>
                  </div>
                  {/* Tooltip arrow */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
