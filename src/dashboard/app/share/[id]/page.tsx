'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AnalysisResult from '@/components/AnalysisResult';
import PoweredByBadge from '@/components/PoweredByBadge';
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
            href="/"
            className="inline-block rounded-lg bg-[#1B3A5C] px-6 py-3 text-white font-medium hover:bg-[#2A5580]"
          >
            Publish Gateで分析してみる
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Share header */}
      <div className="mb-6 rounded-lg border border-[#E2E8F0] bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#64748B]">共有された分析結果</p>
            <p className="text-sm font-medium text-[#1B3A5C] mt-1">{data.url}</p>
          </div>
          <Link
            href="/"
            className="rounded-lg bg-[#1B3A5C] px-4 py-2 text-sm text-white font-medium hover:bg-[#2A5580]"
          >
            自分のLPも分析する
          </Link>
        </div>
      </div>

      {/* Results */}
      {data.result && (
        <AnalysisResult result={data.result} />
      )}

      {/* Powered by badge */}
      <div className="mt-8 flex justify-center">
        <PoweredByBadge />
      </div>
    </div>
  );
}
