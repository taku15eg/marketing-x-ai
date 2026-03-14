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
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1B3A5C] border-t-transparent" />
          <p className="text-sm text-[#64748B]">分析結果を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-2">リンクが無効です</h2>
          <p className="text-[#64748B] mb-8">{error || '分析結果が見つかりません。リンクの有効期限が切れている可能性があります。'}</p>
          <Link
            href="/?ref=share_expired"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1B3A5C] px-8 py-3.5 text-white font-bold hover:bg-[#2A5580] transition-colors shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
            </svg>
            Publish Gateで分析してみる
          </Link>
          <p className="mt-4 text-xs text-[#94A3B8]">URLを入力するだけ。無料・登録不要。</p>
        </div>
      </div>
    );
  }

  const issueCount = data.result?.issues?.length ?? 0;
  const topIssue = data.result?.issues?.[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Professional share header */}
      <div className="mb-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1B3A5C]/10 text-[#1B3A5C] text-xs font-semibold">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                LP分析レポート
              </span>
              {issueCount > 0 && (
                <span className="text-xs text-[#64748B]">
                  {issueCount}件の改善課題を検出
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-[#1B3A5C] truncate max-w-lg" title={data.url}>
              {data.url}
            </p>
            {data.result?.metadata && (
              <p className="text-xs text-[#94A3B8] mt-1">
                分析日: {new Date(data.result.metadata.analyzed_at).toLocaleDateString('ja-JP', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            )}
            <div className="mt-3">
              <SocialShareButtons
                shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
                topFinding={topIssue?.title}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Link
              href="/?ref=share"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B3A5C] px-6 py-3 text-sm text-white font-bold hover:bg-[#2A5580] transition-colors shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
              </svg>
              自分のLPも分析する（無料）
            </Link>
          </div>
        </div>
      </div>

      {/* Results */}
      {data.result && (
        <AnalysisResult result={data.result} />
      )}

      {/* Bottom CTA - viral conversion point */}
      <div className="mt-10 rounded-2xl bg-gradient-to-br from-[#1B3A5C] via-[#264d75] to-[#2a5a8c] p-10 text-center text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-3">あなたのLPも分析してみませんか？</h2>
        <p className="text-white/80 text-sm mb-6 max-w-md mx-auto">
          URLを入れるだけで、プロのマーケ責任者がやることを全部やってくれます。アカウント登録不要・完全無料。
        </p>
        <Link
          href="/?ref=share_bottom"
          className="inline-flex items-center gap-2 rounded-xl bg-white text-[#1B3A5C] px-10 py-4 font-bold text-base hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl"
        >
          無料で分析を始める
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        <p className="mt-4 text-white/50 text-xs">30秒で結果が出ます</p>
      </div>

      {/* Powered by badge */}
      <div className="mt-8 mb-4 flex justify-center">
        <PoweredByBadge />
      </div>
    </div>
  );
}
