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
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setError(null);
  }, []);

  async function handleSubmit(url: string) {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setCurrentStep(1);
    setProgressMessage('企業情報を調査中...');

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
        if (res.status === 429) {
          const resetAt = data.reset_at ? `（リセット: ${new Date(data.reset_at).toLocaleString('ja-JP')}）` : '';
          throw new Error(`${data.error}${resetAt}`);
        }
        throw new Error(data.error || `分析に失敗しました (${res.status})`);
      }

      if (data.status === 'error') {
        throw new Error(data.error || '分析中にエラーが発生しました');
      }

      try {
        sessionStorage.setItem(`analysis_${data.id}`, JSON.stringify(data));
      } catch { /* storage full or unavailable */ }

      await router.push(`/analysis/${data.id}`);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
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
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(37,99,235,0.05) 0%, transparent 60%), #F8F9FB',
        }}
      >
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

        <div className="w-full max-w-2xl animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <UrlInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

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

        {error && (
          <div className="mt-6 w-full max-w-2xl rounded-xl border-2 border-red-300 bg-red-50 p-5 text-red-800 text-sm shadow-sm animate-fade-up" role="alert">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-medium">{error}</p>
                <button
                  onClick={() => { setError(null); setIsLoading(false); }}
                  className="mt-2 inline-flex items-center gap-1 text-red-600 font-medium underline hover:no-underline cursor-pointer"
                >
                  再試行する
                </button>
              </div>
            </div>
          </div>
        )}

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

      {/* Pain Section (with solve tags) */}
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
              solve="4ステップ根拠チェーンで原因を構造化"
            />
            <PainCard
              number="02"
              title="何をすればいいかわからない"
              description="課題は感じている。でも確からしい仮説が立てられず、施策の優先度がつけられない。"
              solve="インパクト順に3件の改善提案を自動生成"
            />
            <PainCard
              number="03"
              title="実装に渡すと壊れる"
              description="指示書を書くのに2時間。渡しても意図が伝わらず手戻り。分業の摩擦でスピードが出ない。"
              solve="デザイナー/エンジニア向け依頼パックを自動生成"
            />
            <PainCard
              number="04"
              title="やったことが残らない"
              description="施策を回す時間より、ログや報告書を作る時間のほうが長い。学びが属人化して組織に残らない。"
              solve="実験ノートで施策ログを自動蓄積・AI学習"
            />
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="px-6 py-20 bg-white" id="demo">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] text-center mb-3">
            URLを入れるだけ。あとは全自動。
          </h2>
          <p className="text-[#4B5563] text-center mb-12">
            4ステップパイプラインが30秒で完了
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StepCard step={1} title="企業を知る" description="ドメインから企業情報を自動取得。ブランドトーン・語彙・実績を理解" />
            <StepCard step={2} title="ページを見る" description="Vision API + DOM解析でFV・CTA・構造・信頼性要素を読み取り" />
            <StepCard step={3} title="診断する" description="4ステップ根拠チェーンで課題をインパクト順に構造化" />
            <StepCard step={4} title="依頼パックを出す" description="デザイナー向け・エンジニア向けの依頼書を自動生成" />
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-3 bg-[#2563EB] text-white font-semibold rounded-xl hover:bg-[#1D4ED8] transition-colors cursor-pointer"
            >
              今すぐ試してみる
            </button>
          </div>
        </div>
      </section>

      {/* ChatGPT Comparison Section */}
      <section className="px-6 py-20 bg-[#F8F9FB]" id="comparison">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] text-center mb-3">
            ChatGPTに「LP改善して」と聞くのとは違う
          </h2>
          <p className="text-[#4B5563] text-center mb-12">
            汎用AIとLP特化ツールの決定的な違い
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 bg-[#F1F5F9] rounded-tl-lg font-medium text-[#64748B]">比較項目</th>
                  <th className="text-left py-3 px-4 bg-[#F1F5F9] font-medium text-[#64748B]">ChatGPT / 汎用AI</th>
                  <th className="text-left py-3 px-4 bg-[#EFF6FF] rounded-tr-lg font-medium text-[#2563EB]">Publish Gate</th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow
                  label="入力"
                  generic="プロンプトを自分で書く"
                  pg="URLを入れるだけ"
                />
                <ComparisonRow
                  label="企業理解"
                  generic="なし（自分で説明が必要）"
                  pg="自動でブランドトーン・実績を取得"
                />
                <ComparisonRow
                  label="ページ読み取り"
                  generic="URLを渡しても中身を見ない"
                  pg="Vision API + DOM解析で実データ分析"
                />
                <ComparisonRow
                  label="根拠"
                  generic="「こうしたほうがいいと思います」"
                  pg="4ステップ根拠チェーン（観察→業界傾向→ギャップ→仮説）"
                />
                <ComparisonRow
                  label="実装"
                  generic="アイデア止まり"
                  pg="デザイナー/エンジニア向け依頼書を自動生成"
                />
                <ComparisonRow
                  label="学習"
                  generic="毎回ゼロから"
                  pg="実験ノートで施策効果を蓄積・次の提案に反映"
                />
                <ComparisonRow
                  label="法令チェック"
                  generic="なし"
                  pg="薬機法・景表法リスクを自動検出"
                  isLast
                />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Persona Flows Section */}
      <section className="px-6 py-20 bg-white" id="personas">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] text-center mb-3">
            あなたの役割に合った使い方
          </h2>
          <p className="text-[#4B5563] text-center mb-12">
            3つのユーザータイプに最適化された体験
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PersonaCard
              emoji="🚀"
              type="代理業・フリーランス"
              name="案件を量でこなしたい人"
              quote="分析→依頼書が自動で出れば、1人で10案件回せる"
              flow={['URL入力', '提案3件を確認', '依頼パックをクライアントに共有', 'ABテスト結果を実験ノートに記録']}
              color="#2563EB"
            />
            <PersonaCard
              emoji="📊"
              type="事業会社マーケター"
              name="数字の原因が知りたい人"
              quote="なんでこの数字なのかが見えない、それがわかるだけで十分"
              flow={['URL入力', '根拠チェーンで原因を理解', '施策の優先度を判断', 'チームに依頼書を共有']}
              color="#059669"
            />
            <PersonaCard
              emoji="👔"
              type="マーケ責任者"
              name="チームの品質を標準化したい人"
              quote="メンバーにまずスキャンさせて、出てきた提案を持ってこさせる"
              flow={['メンバーがURL入力', '提案を責任者がレビュー', '承認した施策を実行', '実験ノートでチーム学習']}
              color="#7C3AED"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-6 py-20 bg-[#F8F9FB]" id="pricing">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] text-center mb-3">
            まずは無料で。必要になったらアップグレード。
          </h2>
          <p className="text-[#4B5563] text-center mb-12">
            遮断型のアップグレードは一切しません
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <PricingCard
              name="Free"
              price="0"
              unit=""
              description="まずは体験"
              features={[
                '月5回まで分析',
                '根拠つき提案3件',
                'Before/After表示',
                '依頼パックプレビュー',
              ]}
            />
            <PricingCard
              name="Starter"
              price="4,980"
              unit="/月"
              description="本格利用"
              features={[
                '月30回まで分析',
                '依頼パック詳細＋コピー',
                '共有URL生成',
                '実験ノート',
                '広告訴求文の自動生成',
              ]}
              highlight
            />
            <PricingCard
              name="Pro"
              price="14,800"
              unit="/月"
              description="プロ向け"
              features={[
                '無制限スキャン',
                'GSC / GA4連携',
                '競合分析（3社）',
                'レポート自動生成',
                'メール通知',
              ]}
            />
            <PricingCard
              name="Business"
              price="49,800"
              unit="/月"
              description="チーム運用"
              features={[
                'Pro全機能',
                'チーム機能（複数サイト）',
                '競合分析 無制限',
                '事業分析',
                '優先サポート',
              ]}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-20 bg-white" id="faq">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] text-center mb-12">
            よくある質問
          </h2>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem
                key={i}
                question={item.q}
                answer={item.a}
                isOpen={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-20 bg-[#2563EB] text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">
            まずは30秒で試してみる
          </h2>
          <p className="text-blue-100 mb-8">
            アカウント不要。URLを入れるだけで改善提案が出ます。
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-8 py-3 bg-white text-[#2563EB] font-semibold rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
          >
            URLを入力する
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-[#E2E8F0] bg-[#F8F9FB]">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[#2563EB]">PG</span>
              <span className="font-semibold text-[#111827]">Publish Gate</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#64748B]">
              <a href="#features" className="hover:text-[#111827] transition-colors">機能</a>
              <a href="#demo" className="hover:text-[#111827] transition-colors">使い方</a>
              <a href="#comparison" className="hover:text-[#111827] transition-colors">比較</a>
              <a href="#pricing" className="hover:text-[#111827] transition-colors">料金</a>
              <a href="#faq" className="hover:text-[#111827] transition-colors">FAQ</a>
            </nav>
          </div>
          <div className="mt-6 text-center text-xs text-[#9CA3AF]">
            Powered by Publish Gate
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── FAQ Data ── */

const FAQ_ITEMS = [
  {
    q: '本当にURLを入れるだけで使えますか？',
    a: 'はい。URLを入力して「改善ポイントを見つける」ボタンを押すだけです。追加の情報入力は一切不要です。約30秒でAIが企業理解・ページ分析・課題診断・依頼書作成まで全自動で行います。アカウント登録も不要で、すぐにお試しいただけます。',
  },
  {
    q: 'ChatGPTに「LP改善して」と聞くのと何が違いますか？',
    a: '大きく3つ違います。(1) ChatGPTはURLの中身を見ませんが、Publish GateはVision API + DOM解析でページの実データを読み取ります。(2) 「こうした方がいい」ではなく、4ステップの根拠チェーン（現状→業界傾向→ギャップ→仮説）で構造的に課題を特定します。(3) 分析止まりではなく、デザイナー/エンジニア向けの依頼書まで自動生成するため、そのまま実装に渡せます。',
  },
  {
    q: '無料プランでどこまで使えますか？',
    a: 'Freeプランでは月5回まで分析できます。根拠つき提案3件、Before/After表示、依頼パックのプレビューが含まれます。依頼パックの詳細コピーや共有URL生成にはStarterプラン（¥4,980/月）へのアップグレードが必要ですが、分析結果の品質はプランによる差はありません。',
  },
  {
    q: 'どのようなページに対応していますか？',
    a: 'LP（ランディングページ）を中心に、コーポレートサイト、ECサイト、サービスサイトなど、公開されているWebページ全般に対応しています。BtoB SaaS、人材、不動産、健康食品、化粧品など業界を問わず利用可能です。画像ベースのLP（日本で主流）にもVision APIで対応しています。',
  },
  {
    q: '分析結果を他の人に共有できますか？',
    a: 'Starterプラン以上で、分析結果を共有URLとして発行できます。URLをチームメンバーやクライアントに送るだけで、提案内容と依頼書を確認してもらえます。依頼書には「Powered by Publish Gate」が付き、受け取った方もそこからFree登録できます。',
  },
  {
    q: '薬機法・景表法チェックはどの程度正確ですか？',
    a: 'AIによる自動検出のため、法的な保証はできません。高リスク・中リスク・低リスクの3段階で表現をフラグ付けし、修正の参考情報として提供しています。最終的な法令適合性の判断は、専門家にご確認ください。',
  },
  {
    q: 'API料金で赤字になりませんか？料金の根拠は？',
    a: '1回の分析でVision API + Claude APIを使用し、原価は約¥30〜50です。Freeプランは月5回（原価¥150〜250）に制限しており、Starterプラン（¥4,980/月・30回）では原価¥900〜1,500に対して十分な収益性を確保しています。同一URLの再分析は1時間キャッシュで重複コストを削減しています。',
  },
  {
    q: 'データのセキュリティは大丈夫ですか？',
    a: '分析対象URLのSSRF防御（プライベートIPレンジの拒否）、プロンプトインジェクション防御（ページコンテンツのサニタイズ）、共有URLのID推測防止（nanoid 21文字）を実装しています。分析対象のページデータを第三者に提供することはありません。',
  },
  {
    q: '解約はいつでもできますか？',
    a: 'はい。月額プランはいつでも解約でき、解約後も請求期間の終了まで利用可能です。年間契約の縛りはありません。Freeプランへの戻しも自動で行われます。',
  },
];

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

function PainCard({ number, title, description, solve }: { number: string; title: string; description: string; solve: string }) {
  return (
    <div className="rounded-xl bg-white border border-[#E5E7EB] p-6">
      <span className="text-xs font-bold text-[#9CA3AF] tracking-wider">PAIN {number}</span>
      <h4 className="font-semibold text-[#111827] mt-2 mb-2">{title}</h4>
      <p className="text-sm text-[#4B5563] leading-relaxed mb-3">{description}</p>
      <div className="flex items-center gap-2 text-xs text-[#059669] bg-emerald-50 px-3 py-1.5 rounded-full w-fit">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {solve}
      </div>
    </div>
  );
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="relative rounded-xl border border-[#E5E7EB] bg-white p-5 hover:border-[#2563EB]/30 hover:shadow-md transition-all">
      <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-sm font-bold mb-3">
        {step}
      </div>
      <h4 className="font-semibold text-[#111827] mb-1.5">{title}</h4>
      <p className="text-xs text-[#4B5563] leading-relaxed">{description}</p>
    </div>
  );
}

function ComparisonRow({ label, generic, pg, isLast }: { label: string; generic: string; pg: string; isLast?: boolean }) {
  const borderClass = isLast ? '' : 'border-b border-[#E2E8F0]';
  return (
    <tr className={borderClass}>
      <td className="py-3 px-4 font-medium text-[#111827]">{label}</td>
      <td className="py-3 px-4 text-[#64748B]">{generic}</td>
      <td className="py-3 px-4 text-[#111827] bg-[#EFF6FF]/50 font-medium">{pg}</td>
    </tr>
  );
}

function PersonaCard({ emoji, type, name, quote, flow, color }: {
  emoji: string; type: string; name: string; quote: string; flow: string[]; color: string;
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 hover:shadow-md transition-all">
      <div className="text-3xl mb-3">{emoji}</div>
      <div className="text-xs font-medium mb-1" style={{ color }}>{type}</div>
      <h4 className="font-semibold text-[#111827] mb-2">{name}</h4>
      <p className="text-xs text-[#64748B] italic mb-4">&ldquo;{quote}&rdquo;</p>
      <div className="space-y-2">
        {flow.map((step, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-[#4B5563]">
            <span className="w-5 h-5 rounded-full bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#64748B]">{i + 1}</span>
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingCard({ name, price, unit, description, features, highlight }: {
  name: string; price: string; unit: string; description: string; features: string[]; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-6 ${highlight ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20 bg-white' : 'border-[#E5E7EB] bg-white'}`}>
      {highlight && (
        <span className="inline-block text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full mb-3">おすすめ</span>
      )}
      <h4 className="font-bold text-[#111827] text-lg">{name}</h4>
      <p className="text-xs text-[#64748B] mb-3">{description}</p>
      <div className="flex items-baseline gap-0.5 mb-4">
        <span className="text-xs text-[#64748B]">¥</span>
        <span className="text-3xl font-bold text-[#111827]">{price}</span>
        {unit && <span className="text-sm text-[#64748B]">{unit}</span>}
      </div>
      <ul className="space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#4B5563]">
            <svg className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FaqItem({ question, answer, isOpen, onClick }: {
  question: string; answer: string; isOpen: boolean; onClick: () => void;
}) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white overflow-hidden">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-[#111827] hover:bg-[#F8F9FB] transition-colors cursor-pointer"
      >
        {question}
        <svg
          className={`w-4 h-4 text-[#9CA3AF] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 pb-4 text-sm text-[#4B5563] leading-relaxed">
          {answer}
        </div>
      )}
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
