'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TabNavigation from '@/components/TabNavigation';
import AnalysisResult from '@/components/AnalysisResult';
import ShareButton from '@/components/ShareButton';
import type { AnalyzeResponse } from '@/lib/types';

export default function AnalysisPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const res = await fetch(`/api/share?id=${id}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        } else {
          // Try direct from memory (same session)
          setError('分析結果が見つかりません。URLを再入力してください。');
        }
      } catch {
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }

    // Check sessionStorage first
    const stored = sessionStorage.getItem(`analysis_${id}`);
    if (stored) {
      try {
        setData(JSON.parse(stored));
        setLoading(false);
        return;
      } catch { /* fallthrough */ }
    }

    fetchAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B3A5C] border-t-transparent" />
          <span className="ml-3 text-[#64748B]">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700 mb-4">{error || '分析結果が見つかりません'}</p>
          <Link href="/" className="text-[#1B3A5C] underline hover:no-underline">
            トップに戻って再分析
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* URL + Actions bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm text-[#64748B] shrink-0">分析対象:</span>
          <span className="text-sm font-medium text-[#1B3A5C] truncate">{data.url}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ShareButton analysisId={data.id} />
          <Link
            href="/"
            className="rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-[#64748B] hover:bg-gray-50"
          >
            新しい分析
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabNavigation activeTab={1} />

      {/* Results */}
      {data.result ? (
        <div className="mt-6">
          <AnalysisResult result={data.result} />
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-amber-700">分析中にエラーが発生しました: {data.error}</p>
        </div>
      )}
    </div>
  );
}
