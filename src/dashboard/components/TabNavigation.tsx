'use client';

import { TABS } from '../lib/types';

interface TabNavigationProps {
  activeTab: number;
  onTabChange?: (tabId: number) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="w-full border-b border-gray-200 bg-white">
      <nav className="flex" role="tablist" aria-label="分析タブ">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              className={`
                relative px-6 py-3.5 text-sm font-medium transition-all duration-200
                flex items-center gap-1.5
                ${isActive
                  ? 'text-[#2563EB] border-b-2 border-[#2563EB]'
                  : 'text-gray-500 hover:text-[#2563EB] hover:bg-gray-50 cursor-pointer'
                }
              `}
              onClick={() => {
                if (onTabChange) {
                  onTabChange(tab.id);
                }
              }}
            >
              <span>{tab.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
