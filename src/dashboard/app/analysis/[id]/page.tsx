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
        const res = await fetch(`/api/analyze?id=${id}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
          try {
            sessionStorage.setItem(`analysis_${id}`, JSON.stringify(result));
          } catch { /* storage full */ }
        } else {
          setError('分析結果が見つかりません。URLを再入力してください。');
        }
      } catch {
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }

    // Check sessionStorage first (fast navigation)
    try {
      const stored = sessionStorage.getItem(`analysis_${id}`);
      if (stored) {
        setData(JSON.parse(stored));
        setLoading(false);
        return;
      }
    } catch { /* fallthrough to fetch */ }

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
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#1B3A5C] mb-2">分析結果が見つかりません</h2>
          <p className="text-[#64748B] text-sm mb-6">{error || 'リンクの有効期限が切れている可能性があります。'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1B3A5C] px-6 py-3 text-white font-bold hover:bg-[#2A5580] transition-colors"
          >
            新しい分析を始める
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* URL + Actions bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm text-[#64748B] shrink-0">分析対象:</span>
          <span className="text-sm font-medium text-[#1B3A5C] truncate" title={data.url}>{data.url}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-[#64748B] hover:bg-gray-50"
          >
            新しい分析
          </Link>
        </div>
      </div>

      {/* Share CTA banner - prominent placement for viral conversion */}
      <div className="mb-6 rounded-xl border border-[#1B3A5C]/15 bg-gradient-to-r from-[#1B3A5C]/5 to-[#1B3A5C]/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-[#1B3A5C]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1B3A5C]/10 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <div>
            <span className="font-bold block">この分析をチームやクライアントに共有</span>
            <span className="text-xs text-[#64748B]">共有リンクは90日間有効です</span>
          </div>
        </div>
        <ShareButton analysisId={data.id} />
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
