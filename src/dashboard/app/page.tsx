'use client';

import { Suspense, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import UrlInput from '@/components/UrlInput';
import LoadingProgress from '@/components/LoadingProgress';

export default function HomePage() {
  return (
    <Suspense>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') || undefined;
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setError(null);
  }, []);

  async function handleSubmit(url: string) {
    // Abort any in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setCurrentStep(1);
    setProgressMessage('企業情報を調査中...');

    // Simulate progress updates (approximation of actual pipeline steps)
    const progressTimers = [
      setTimeout(() => { setCurrentStep(2); setProgressMessage('ページを読み取り中...'); }, 3000),
      setTimeout(() => { setCurrentStep(3); setProgressMessage('課題を診断中...'); }, 8000),
      setTimeout(() => { setCurrentStep(4); setProgressMessage('改善提案を作成中...'); }, 15000),
    ];

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, ref }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        // Specific error messages based on HTTP status
        if (res.status === 429) {
          const resetAt = data.reset_at ? `（リセット: ${new Date(data.reset_at).toLocaleString('ja-JP')}）` : '';
          throw new Error(`${data.error}${resetAt}`);
        }
        throw new Error(data.error || `分析に失敗しました (${res.status})`);
      }

      if (data.status === 'error') {
        throw new Error(data.error || '分析中にエラーが発生しました');
      }

      // Store in sessionStorage for analysis page to retrieve
      try {
        sessionStorage.setItem(`analysis_${data.id}`, JSON.stringify(data));
      } catch { /* storage full or unavailable */ }

      // Navigate to results page
      router.push(`/analysis/${data.id}`);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled — do nothing
        return;
      }
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
      setIsLoading(false);
    } finally {
      progressTimers.forEach(clearTimeout);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-16 pb-24">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-[#1B3A5C] mb-3 leading-tight">
          URLを入れるだけで、<br className="sm:hidden" />
          プロのマーケ責任者が<br className="hidden sm:block" />やることを全部やってくれる
        </h1>
        <p className="text-[#64748B] text-lg max-w-2xl mx-auto">
          課題の診断からデザイナーへの依頼書まで自動生成。<br className="hidden sm:block" />
          何を聞くべきかすら知らなくても、答えが出るAI分析エンジン。
        </p>
      </div>

      {/* URL Input */}
      {!isLoading && (
        <UrlInput onSubmit={handleSubmit} isLoading={isLoading} />
      )}

      {/* Loading Progress */}
      {isLoading && (
        <div className="mt-8">
          <LoadingProgress currentStep={currentStep} message={progressMessage} />
          <div className="mt-4 text-center">
            <button
              onClick={handleCancel}
              className="text-sm text-[#64748B] underline hover:no-underline cursor-pointer"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm" role="alert">
          {error}
          <button
            onClick={() => { setError(null); setIsLoading(false); }}
            className="ml-3 underline hover:no-underline cursor-pointer"
          >
            再試行
          </button>
        </div>
      )}

      {/* Feature highlights - persona-driven copy */}
      {!isLoading && !error && (
        <>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon="🔍"
              title="数字が悪い理由が、見える"
              description="「なんでこの数字なの？」がもう怖くない。課題をインパクト順に構造化して根因を特定"
            />
            <FeatureCard
              icon="📋"
              title="依頼書まで自動で出る"
              description="マーケを知らないデザイナーにも伝わる改善ブリーフ。ディレクションの時間がゼロに"
            />
            <FeatureCard
              icon="⚖️"
              title="法令リスクも自動チェック"
              description="薬機法・景表法に抵触する表現を検知。健康食品・化粧品LPでも安心して公開できる"
            />
          </div>

          {/* Social proof */}
          <div className="mt-12 text-center">
            <p className="text-sm text-[#64748B]">
              アカウント登録不要・完全無料・分析結果はURLで共有可能
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 text-center">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-[#1B3A5C] mb-2">{title}</h3>
      <p className="text-sm text-[#64748B]">{description}</p>
    </div>
  );
}
