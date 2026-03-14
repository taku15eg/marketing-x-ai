import type { Metadata } from 'next';

// Dynamic OGP metadata for share pages
// Per CLAUDE.md security: do NOT include the analysis target URL in OGP
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'LP分析レポート | Publish Gate',
    description: 'Publish GateによるLP改善分析の結果が共有されました。URLを入れるだけで、あなたのLPも無料で分析できます。',
    openGraph: {
      title: 'LP分析レポートが共有されました',
      description: 'URLを入れるだけで、プロのマーケ責任者がやることを全部やってくれるAI分析ツール。あなたのLPも無料で分析してみませんか？',
      type: 'website',
      siteName: 'Publish Gate',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'LP分析レポートが共有されました | Publish Gate',
      description: 'URLを入れるだけで、LP改善提案を自動生成。あなたのLPも無料で分析できます。',
    },
    robots: {
      index: true,
      follow: true,
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
