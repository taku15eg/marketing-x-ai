import type { Metadata } from 'next';
import Link from 'next/link';
import ErrorBoundary from '@/components/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'Publish Gate — ページを開くだけで、改善が前に進む',
  description: 'URLを入れるだけで、LP改善提案を自動生成。デザイナー向け・エンジニア向けの依頼書まで作ります。アカウント不要・無料。',
  openGraph: {
    title: 'Publish Gate — ページを開くだけで、改善が前に進む',
    description: 'URLを入れるだけで、LP改善提案を自動生成。デザイナー向け・エンジニア向けの依頼書まで作ります。',
    type: 'website',
    siteName: 'Publish Gate',
  },
  twitter: {
    card: 'summary',
    title: 'Publish Gate — ページを開くだけで、改善が前に進む',
    description: 'URLを入れるだけで、LP改善提案を自動生成。デザイナー向け・エンジニア向けの依頼書まで作ります。',
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
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#FAFBFC]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
        <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/85 backdrop-blur-lg">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white text-xs font-extrabold">
                  PG
                </div>
                <span className="text-lg font-bold text-[#111827]">Publish Gate</span>
              </Link>
              <nav className="hidden sm:flex items-center gap-8 text-sm">
                <a href="#features" className="text-[#4B5563] hover:text-[#111827] transition-colors">機能</a>
                <a href="#pain" className="text-[#4B5563] hover:text-[#111827] transition-colors">課題</a>
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
