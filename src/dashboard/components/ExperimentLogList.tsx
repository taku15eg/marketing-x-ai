'use client';

import { useState, useEffect } from 'react';
import type { ExperimentLog } from '@/lib/types';
import { CATEGORY_CONFIG, EFFECT_RATING_CONFIG, EXECUTION_STATUS_CONFIG } from '@/lib/types';
import { getExperimentLogs, updateExperimentLog } from '@/lib/experiment-store';

export default function ExperimentLogList() {
  const [logs, setLogs] = useState<ExperimentLog[]>([]);

  useEffect(() => {
    setLogs(getExperimentLogs());
  }, []);

  function handleStatusChange(id: string, status: ExperimentLog['execution_status']) {
    updateExperimentLog(id, { execution_status: status });
    setLogs(getExperimentLogs());
  }

  function handleRatingChange(id: string, rating: ExperimentLog['effect_rating']) {
    updateExperimentLog(id, { effect_rating: rating });
    setLogs(getExperimentLogs());
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-500 mb-2">まだ実験ノートがありません</h3>
        <p className="text-sm text-gray-400">
          分析結果の提案を実行すると、自動的に記録されます
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-900">実験ノート</h2>
        <span className="text-sm text-gray-500">{logs.length}件の記録</span>
      </div>

      {logs.map((log) => {
        const category = CATEGORY_CONFIG[log.auto_recorded.category];

        return (
          <div key={log.id} className="border border-gray-200 rounded-xl bg-white p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: category.bgColor, color: category.color }}
                >
                  {category.label}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(log.created_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <span className="text-xs text-gray-400 font-mono truncate max-w-[200px]">
                {log.page_url}
              </span>
            </div>

            {/* Before/After */}
            <div className="space-y-1 mb-4">
              <div className="flex gap-2 items-start">
                <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded flex-shrink-0">B</span>
                <p className="text-sm text-gray-600">{log.auto_recorded.before}</p>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex-shrink-0">A</span>
                <p className="text-sm text-gray-700">{log.auto_recorded.after}</p>
              </div>
            </div>

            {/* Status & Rating */}
            <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
              {/* Execution status */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 mr-1">状態:</span>
                {(['executed', 'hold', 'skipped'] as const).map((status) => {
                  const config = EXECUTION_STATUS_CONFIG[status];
                  const isSelected = log.execution_status === status;
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(log.id, status)}
                      className={`px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>

              {/* Effect rating */}
              {log.execution_status === 'executed' && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 mr-1">効果:</span>
                  {([1, 2, 3, 4, 5] as const).map((rating) => {
                    const config = EFFECT_RATING_CONFIG[rating];
                    const isSelected = log.effect_rating === rating;
                    return (
                      <button
                        key={rating}
                        onClick={() => handleRatingChange(log.id, rating)}
                        title={config.label}
                        className={`w-6 h-6 text-xs rounded cursor-pointer transition-colors ${
                          isSelected
                            ? 'text-white font-bold'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        style={isSelected ? { backgroundColor: config.color } : undefined}
                      >
                        {rating}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
