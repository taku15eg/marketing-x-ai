import type { Metadata } from 'next';
import Link from 'next/link';
import ErrorBoundary from '@/components/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'Publish Gate - URLを入れるだけで、プロのマーケ責任者がやることを全部やってくれる',
  description: 'URLを入力するだけで、LP分析・課題診断・デザイナーへの改善依頼書まで自動生成。何を聞くべきかすら知らなくても、答えが出るAI分析エンジン。',
  openGraph: {
    title: 'Publish Gate — URLを入れるだけでLP改善が見える',
    description: '課題の診断からデザイナーへの依頼書まで自動生成。アカウント登録不要・完全無料。',
    type: 'website',
    siteName: 'Publish Gate',
  },
  twitter: {
    card: 'summary',
    title: 'Publish Gate — URLを入れるだけでLP改善が見える',
    description: '課題の診断からデザイナーへの依頼書まで自動生成。アカウント登録不要・完全無料。',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        {/* next/font/google preferred but requires network at build time.
            Using link tags with preconnect for equivalent performance. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#F8F9FB]">
        <header className="border-b border-[#E2E8F0] bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#1B3A5C]">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.8" />
                  <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-lg font-bold text-[#1B3A5C]">Publish Gate</span>
              </Link>
              <nav className="flex items-center gap-4 text-sm text-[#64748B]">
                <span>Phase 0.5 β</span>
              </nav>
            </div>
          </div>
        </header>
        <main>
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </body>
    </html>
  );
}
