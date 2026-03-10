'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UrlInput from '@/components/UrlInput';
import LoadingProgress from '@/components/LoadingProgress';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(url: string) {
    setIsLoading(true);
    setError(null);
    setCurrentStep(1);
    setProgressMessage('企業情報を調査中...');

    // Simulate progress updates
    const progressTimers = [
      setTimeout(() => { setCurrentStep(2); setProgressMessage('ページを読み取り中...'); }, 3000),
      setTimeout(() => { setCurrentStep(3); setProgressMessage('課題を診断中...'); }, 8000),
      setTimeout(() => { setCurrentStep(4); setProgressMessage('改善提案を作成中...'); }, 15000),
    ];

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `分析に失敗しました (${res.status})`);
      }

      if (data.status === 'error') {
        throw new Error(data.error || '分析中にエラーが発生しました');
      }

      // Navigate to results page
      router.push(`/analysis/${data.id}`);
    } catch (err) {
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
        <h1 className="text-3xl font-bold text-[#1B3A5C] mb-3">
          URLを入れるだけで、LP改善が見える
        </h1>
        <p className="text-[#64748B] text-lg">
          AI分析エンジンが課題を診断し、デザイナー・エンジニアへの改善ブリーフを自動生成
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
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
          {error}
          <button
            onClick={() => { setError(null); setIsLoading(false); }}
            className="ml-3 underline hover:no-underline"
          >
            再試行
          </button>
        </div>
      )}

      {/* Feature highlights */}
      {!isLoading && !error && (
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon="🔍"
            title="4ステップAI分析"
            description="企業理解→ページ読取→課題診断→ブリーフ生成を全自動で実行"
          />
          <FeatureCard
            icon="📋"
            title="依頼パック自動生成"
            description="デザイナー・エンジニアにそのまま渡せる改善指示書"
          />
          <FeatureCard
            icon="⚖️"
            title="薬機法・景表法チェック"
            description="法令リスクのある表現を自動検知して警告"
          />
        </div>
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
