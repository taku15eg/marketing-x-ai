import type { Metadata } from 'next';

// Dynamic OGP metadata for share pages
// Per CLAUDE.md security: do NOT include the analysis target URL in OGP
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'LP分析結果 | Publish Gate',
    description: 'Publish GateによるLP改善分析の結果が共有されました。あなたのLPも無料で分析できます。',
    openGraph: {
      title: 'LP分析結果が共有されました',
      description: 'URLを入れるだけで、プロのマーケ責任者がやることを全部やってくれるAI分析ツール。あなたのLPも無料で分析してみませんか？',
      type: 'website',
      siteName: 'Publish Gate',
    },
    twitter: {
      card: 'summary',
      title: 'LP分析結果が共有されました | Publish Gate',
      description: 'URLを入れるだけで、LP改善提案を自動生成。あなたのLPも無料で分析できます。',
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
