'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TabNavigation from '@/components/TabNavigation';
import AnalysisResult from '@/components/AnalysisResult';
import AdCreativeResult from '@/components/AdCreativeResult';
import ShareButton from '@/components/ShareButton';
import type { AnalyzeResponse, AdCreativeResult as AdCreativeResultType } from '@/lib/types';

export default function AnalysisPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(1);

  // Tab 2 state
  const [adCreatives, setAdCreatives] = useState<AdCreativeResultType | null>(null);
  const [adCreativesLoading, setAdCreativesLoading] = useState(false);
  const [adCreativesError, setAdCreativesError] = useState<string | null>(null);

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

  const fetchAdCreatives = useCallback(async () => {
    if (adCreatives || adCreativesLoading) return;

    // Check sessionStorage cache first
    const cached = sessionStorage.getItem(`ad_creative_${id}`);
    if (cached) {
      try {
        setAdCreatives(JSON.parse(cached));
        return;
      } catch { /* fallthrough */ }
    }

    setAdCreativesLoading(true);
    setAdCreativesError(null);

    try {
      // Try GET first (cached on server)
      const getRes = await fetch(`/api/ad-creative?analysis_id=${id}`);
      if (getRes.ok) {
        const result = await getRes.json();
        setAdCreatives(result);
        try {
          sessionStorage.setItem(`ad_creative_${id}`, JSON.stringify(result));
        } catch { /* storage full */ }
        return;
      }

      // Generate new ad creatives
      const postRes = await fetch('/api/ad-creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: id }),
      });

      if (!postRes.ok) {
        const errData = await postRes.json();
        throw new Error(errData.error || '広告訴求の生成に失敗しました');
      }

      const result = await postRes.json();
      setAdCreatives(result);
      try {
        sessionStorage.setItem(`ad_creative_${id}`, JSON.stringify(result));
      } catch { /* storage full */ }
    } catch (err) {
      setAdCreativesError(
        err instanceof Error ? err.message : '広告訴求の生成に失敗しました'
      );
    } finally {
      setAdCreativesLoading(false);
    }
  }, [id, adCreatives, adCreativesLoading]);

  const handleTabChange = useCallback(
    (tabId: number) => {
      setActiveTab(tabId);
      if (tabId === 2 && !adCreatives && !adCreativesLoading) {
        fetchAdCreatives();
      }
    },
    [adCreatives, adCreativesLoading, fetchAdCreatives]
  );

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm text-[#64748B] shrink-0">分析対象:</span>
          <span className="text-sm font-medium text-[#1B3A5C] truncate">{data.url}</span>
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

      {/* Share CTA banner */}
      <div className="mb-6 rounded-xl border border-[#1B3A5C]/10 bg-[#1B3A5C]/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[#1B3A5C]">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="font-medium">この分析結果をチームやクライアントに共有しませんか？</span>
        </div>
        <ShareButton analysisId={data.id} />
      </div>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 1 && (
          data.result ? (
            <AnalysisResult result={data.result} />
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
              <p className="text-amber-700">分析中にエラーが発生しました: {data.error}</p>
            </div>
          )
        )}

        {activeTab === 2 && (
          <div>
            {adCreativesLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B3A5C] border-t-transparent" />
                <span className="ml-3 text-[#64748B]">広告訴求を生成中...</span>
              </div>
            )}
            {adCreativesError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                <p className="text-red-700 mb-3">{adCreativesError}</p>
                <button
                  onClick={fetchAdCreatives}
                  className="text-sm text-[#1B3A5C] underline hover:no-underline"
                >
                  再試行
                </button>
              </div>
            )}
            {adCreatives && <AdCreativeResult result={adCreatives} />}
            {!adCreativesLoading && !adCreativesError && !adCreatives && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">広告訴求文を生成</h3>
                <p className="text-sm text-gray-600 mb-4">
                  LP分析結果に基づいて、Google Ads / Meta / PMax向けの広告訴求文を自動生成します。
                </p>
                <button
                  onClick={fetchAdCreatives}
                  className="rounded-lg bg-[#1B3A5C] px-6 py-3 text-sm font-medium text-white hover:bg-[#2a5a8c] transition-colors"
                >
                  生成する
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
