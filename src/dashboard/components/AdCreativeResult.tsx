'use client';

import { useState } from 'react';
import type { AdCreativeResult as AdCreativeResultType, AdHeadline, AdDescription, MetaAdText, TargetingRecommendation } from '../lib/types';
import PoweredByBadge from './PoweredByBadge';

interface AdCreativeResultProps {
  result: AdCreativeResultType;
}

type Platform = 'google_ads' | 'meta_ads' | 'pmax';

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; bgColor: string }> = {
  google_ads: { label: 'Google Ads RSA', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  meta_ads: { label: 'Meta Ads', color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200' },
  pmax: { label: 'Performance Max', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      title="コピー"
    >
      {copied ? (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function CharCount({ count, max }: { count: number; max: number }) {
  const isOver = count > max;
  return (
    <span className={`text-[10px] font-mono ${isOver ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
      {count}/{max}
    </span>
  );
}

function AngleBadge({ angle }: { angle: string }) {
  return (
    <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">
      {angle}
    </span>
  );
}

function AdTextItem({
  item,
  maxChars,
}: {
  item: AdHeadline | AdDescription | MetaAdText;
  maxChars: number;
}) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-b-0 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{item.text}</p>
        <div className="flex items-center gap-2 mt-1">
          <CharCount count={item.char_count} max={maxChars} />
          {item.angle && <AngleBadge angle={item.angle} />}
        </div>
      </div>
      <CopyButton text={item.text} />
    </div>
  );
}

function PlatformSection({
  platform,
  children,
  rationale,
}: {
  platform: Platform;
  children: React.ReactNode;
  rationale: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const config = PLATFORM_CONFIG[platform];

  return (
    <div className={`border rounded-xl overflow-hidden ${config.bgColor}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <h3 className={`text-base font-bold ${config.color}`}>{config.label}</h3>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="bg-white px-5 pb-5 space-y-4">
          {children}
          {rationale && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <span className="font-semibold">戦略根拠: </span>
                {rationale}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdGroupSection({
  title,
  items,
  maxChars,
}: {
  title: string;
  items: Array<AdHeadline | AdDescription | MetaAdText>;
  maxChars: number;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
        <span className="text-xs text-gray-400">{items.length}件</span>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        {items.map((item, i) => (
          <AdTextItem key={i} item={item} maxChars={maxChars} />
        ))}
      </div>
    </div>
  );
}

function TargetingSection({ recommendations }: { recommendations: TargetingRecommendation[] }) {
  if (recommendations.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-base font-bold text-gray-900">ターゲティング推奨</h3>
      </div>
      <div className="p-5 space-y-3">
        {recommendations.map((rec, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  rec.platform === 'google'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {rec.platform === 'google' ? 'Google' : 'Meta'}
              </span>
              <span className="text-sm font-medium text-gray-900">{rec.audience_type}</span>
            </div>
            <p className="text-xs text-gray-700 mb-1">{rec.description}</p>
            <p className="text-xs text-gray-500">{rec.rationale}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdCreativeResult({ result }: AdCreativeResultProps) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Google Ads RSA */}
      <PlatformSection platform="google_ads" rationale={result.google_ads.rationale}>
        <AdGroupSection title="見出し" items={result.google_ads.headlines} maxChars={30} />
        <AdGroupSection title="説明文" items={result.google_ads.descriptions} maxChars={90} />
      </PlatformSection>

      {/* Meta Ads */}
      <PlatformSection platform="meta_ads" rationale={result.meta_ads.rationale}>
        <AdGroupSection title="プライマリテキスト" items={result.meta_ads.primary_texts} maxChars={125} />
        <AdGroupSection title="見出し" items={result.meta_ads.headlines} maxChars={40} />
        <AdGroupSection title="説明文" items={result.meta_ads.descriptions} maxChars={30} />
        {result.meta_ads.recommended_format && (
          <div className="p-3 bg-indigo-50 rounded-lg">
            <p className="text-xs text-indigo-700">
              <span className="font-semibold">推奨フォーマット: </span>
              {result.meta_ads.recommended_format}
            </p>
          </div>
        )}
      </PlatformSection>

      {/* PMax */}
      <PlatformSection platform="pmax" rationale={result.pmax.rationale}>
        <AdGroupSection title="見出し" items={result.pmax.headlines} maxChars={30} />
        <AdGroupSection title="長い見出し" items={result.pmax.long_headlines} maxChars={90} />
        <AdGroupSection title="説明文" items={result.pmax.descriptions} maxChars={90} />
      </PlatformSection>

      {/* Targeting */}
      <TargetingSection recommendations={result.targeting_recommendations} />

      {/* Metadata */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-xs text-gray-400">
        <span>生成日時: {new Date(result.generated_at).toLocaleString('ja-JP')}</span>
        <PoweredByBadge />
      </div>
    </div>
  );
}
