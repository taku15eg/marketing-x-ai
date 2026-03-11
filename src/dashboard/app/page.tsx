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
      await router.push(`/analysis/${data.id}`);
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
    <div className="min-h-[calc(100vh-56px)]">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-16"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(27,58,92,0.05) 0%, transparent 60%), #F8F9FB',
        }}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-[#E2E8F0] rounded-full text-sm text-[#64748B] mb-8 animate-fade-up">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Chrome拡張で今すぐ使える
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#111827] leading-tight max-w-3xl mb-5 animate-fade-up"
          style={{ animationDelay: '0.1s' }}
        >
          ページを開くだけで<br />
          <span className="text-[#2563EB]">改善が前に進む</span>
        </h1>

        <p className="text-base sm:text-lg text-[#4B5563] max-w-xl leading-relaxed mb-10 animate-fade-up"
          style={{ animationDelay: '0.2s' }}
        >
          URLを入れるだけで、改善提案を自動生成。<br className="hidden sm:block" />
          デザイナー向け・エンジニア向けの依頼書まで作ります。
        </p>

        {/* URL Input - always visible, disabled when loading */}
        <div className="w-full max-w-2xl animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <UrlInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* Loading Progress */}
        {isLoading && (
          <div className="mt-8 w-full max-w-2xl">
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
          <div className="mt-6 w-full max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm" role="alert">
            {error}
            <button
              onClick={() => { setError(null); setIsLoading(false); }}
              className="ml-3 underline hover:no-underline cursor-pointer"
            >
              再試行
            </button>
          </div>
        )}

        {/* Trust Bar */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 mt-10 text-center animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <TrustItem number="30" unit="秒で" label="分析完了" />
          <TrustItem number="3" unit="件の" label="改善提案" />
          <TrustItem number="2" unit="種類の" label="依頼書" />
        </div>

        <p className="mt-6 text-sm text-[#9CA3AF]">
          アカウント不要・無料で月5回まで
        </p>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-white" id="features">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] text-center mb-3">
            改善サイクルを、一気通貫で
          </h2>
          <p className="text-[#4B5563] text-center mb-12">
            分析・判断・実装依頼をひとつの場所で完結
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<SearchIcon />}
              title="課題がインパクト順に並ぶ"
              description="ページの構造・コピー・CTAを分析して、直すべき箇所を優先度つきで3件提案。Before/After付きですぐ判断できます。"
            />
            <FeatureCard
              icon={<DocumentIcon />}
              title="依頼書がそのまま渡せる"
              description="デザイナーにはビジュアル指示書、エンジニアには実装仕様書を自動生成。「渡すだけで伝わる」品質です。"
            />
            <FeatureCard
              icon={<ShieldIcon />}
              title="法令リスクも一緒にチェック"
              description="薬機法・景表法に抵触する表現がないか自動検知。健康食品・化粧品LPでも安心して公開できます。"
            />
          </div>
        </div>
      </section>

      {/* Pain Section */}
      <section className="px-6 py-20 bg-[#F8F9FB]" id="pain">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] text-center mb-12">
            マーケターが毎日ぶつかる4つの壁
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PainCard
              number="01"
              title="なぜ数字が悪いかわからない"
              description="データはある。でも「なんでこの数字なのか」が見えない。分析に時間を使っても答えが出ない。"
            />
            <PainCard
              number="02"
              title="何をすればいいかわからない"
              description="課題は感じている。でも確からしい仮説が立てられず、施策の優先度がつけられない。"
            />
            <PainCard
              number="03"
              title="実装に渡すと壊れる"
              description="指示書を書くのに2時間。渡しても意図が伝わらず手戻り。分業の摩擦でスピードが出ない。"
            />
            <PainCard
              number="04"
              title="やったことが残らない"
              description="施策を回す時間より、ログや報告書を作る時間のほうが長い。学びが属人化して組織に残らない。"
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-20 bg-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">
            まずは30秒で試してみる
          </h2>
          <p className="text-[#4B5563] mb-8">
            アカウント不要。URLを入れるだけで改善提案が出ます。
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-8 py-3 bg-[#2563EB] text-white font-semibold rounded-xl hover:bg-[#1D4ED8] transition-colors cursor-pointer"
          >
            URLを入力する
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-[#E2E8F0] bg-[#F8F9FB] text-center text-sm text-[#9CA3AF]">
        Powered by Publish Gate
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function TrustItem({ number, unit, label }: { number: string; unit: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-baseline gap-0.5">
        <span className="text-2xl sm:text-3xl font-bold text-[#111827]">{number}</span>
        <span className="text-sm text-[#4B5563]">{unit}</span>
      </div>
      <span className="text-xs text-[#9CA3AF]">{label}</span>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 hover:border-[#2563EB]/30 hover:shadow-md transition-all">
      <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-[#111827] mb-2">{title}</h3>
      <p className="text-sm text-[#4B5563] leading-relaxed">{description}</p>
    </div>
  );
}

function PainCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="rounded-xl bg-white border border-[#E5E7EB] p-6">
      <span className="text-xs font-bold text-[#9CA3AF] tracking-wider">PAIN {number}</span>
      <h4 className="font-semibold text-[#111827] mt-2 mb-2">{title}</h4>
      <p className="text-sm text-[#4B5563] leading-relaxed">{description}</p>
    </div>
  );
}

/* ── Icons ── */

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" strokeWidth={2} />
      <path d="M21 21l-4.35-4.35" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
