'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AnalysisResult from '@/components/AnalysisResult';
import PoweredByBadge from '@/components/PoweredByBadge';
import SocialShareButtons from '@/components/SocialShareButtons';
import type { AnalyzeResponse } from '@/lib/types';

export default function SharePage() {
  const params = useParams();
  const shareId = params.id as string;
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSharedAnalysis() {
      try {
        const res = await fetch(`/api/share?id=${shareId}`);
        if (!res.ok) {
          setError('共有リンクが無効または期限切れです');
          return;
        }
        const result = await res.json();
        setData(result);
      } catch {
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }
    fetchSharedAnalysis();
  }, [shareId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B3A5C] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-2">リンクが無効です</h2>
          <p className="text-[#64748B] mb-6">{error || '分析結果が見つかりません'}</p>
          <Link
            href="/?ref=share"
            className="inline-block rounded-lg bg-[#1B3A5C] px-6 py-3 text-white font-medium hover:bg-[#2A5580]"
          >
            Publish Gateで分析してみる
          </Link>
        </div>
      </div>
    );
  }

  const analysisUrl = data.url;
  const reanalyzeHref = `/?ref=share_reanalyze&url=${encodeURIComponent(analysisUrl)}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Share header with prominent CTA */}
      <div className="mb-6 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1B3A5C]/10 text-[#1B3A5C] text-xs font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                共有された分析結果
              </span>
            </div>
            <p className="text-sm font-medium text-[#1B3A5C] truncate max-w-md">{data.url}</p>
            <div className="mt-2">
              <SocialShareButtons
                shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
                topFinding={data.result?.issues?.[0]?.title}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Link
              href="/?ref=share"
              data-track="share_cta_clicked"
              data-track-location="header"
              className="inline-flex items-center gap-2 rounded-lg bg-[#1B3A5C] px-6 py-3 text-sm text-white font-bold hover:bg-[#2A5580] transition-colors shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
              </svg>
              自分のLPも分析する（無料）
            </Link>
            <Link
              href={reanalyzeHref}
              data-track="share_reanalyze_clicked"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#1B3A5C]/30 px-4 py-2 text-xs text-[#1B3A5C] font-medium hover:bg-[#1B3A5C]/5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              このURLを最新データで再分析
            </Link>
          </div>
        </div>
      </div>

      {/* Results */}
      {data.result && (
        <AnalysisResult result={data.result} />
      )}

      {/* Bottom CTA - viral conversion point */}
      <div className="mt-10 rounded-xl bg-gradient-to-r from-[#1B3A5C] to-[#2a5a8c] p-8 text-center text-white">
        <h2 className="text-xl font-bold mb-2">あなたのLPも分析してみませんか？</h2>
        <p className="text-white/80 text-sm mb-5">URLを入れるだけ。アカウント登録不要。完全無料。</p>
        <Link
          href="/?ref=share"
          data-track="share_cta_clicked"
          data-track-location="bottom_banner"
          className="inline-flex items-center gap-2 rounded-lg bg-white text-[#1B3A5C] px-8 py-3 font-bold hover:bg-gray-100 transition-colors shadow-lg"
        >
          無料で分析を始める
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>

      {/* Powered by badge */}
      <div className="mt-8 flex justify-center">
        <PoweredByBadge source="share_page" />
      </div>
    </div>
  );
}
