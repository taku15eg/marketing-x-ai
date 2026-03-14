import type { Metadata } from 'next';

// Dynamic OGP metadata for share pages
// Per CLAUDE.md security: do NOT include the analysis target URL in OGP
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'LP分析結果 | Publish Gate',
    description: 'AIがLPを分析し、改善課題と依頼書を自動生成しました。あなたのLPも無料で分析できます。',
    openGraph: {
      title: 'LP分析で改善ポイントが見つかりました',
      description: 'URLを入れるだけで、課題の診断からデザイナーへの依頼書まで自動生成。あなたのLPも無料で分析してみませんか？',
      type: 'website',
      siteName: 'Publish Gate',
    },
    twitter: {
      card: 'summary',
      title: 'LP分析で改善ポイントが見つかりました | Publish Gate',
      description: 'AIがLP改善点を自動検出。課題の診断から依頼書まで、URLを入れるだけ。無料。',
    },
  };
}

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
