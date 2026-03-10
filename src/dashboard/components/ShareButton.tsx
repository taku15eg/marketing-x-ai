'use client';

import { useState } from 'react';

interface ShareButtonProps {
  analysisId: string;
}

type ShareState = 'idle' | 'loading' | 'copied' | 'error';

export default function ShareButton({ analysisId }: ShareButtonProps) {
  const [state, setState] = useState<ShareState>('idle');
  const [shareUrl, setShareUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleShare() {
    if (state === 'loading') return;

    setState('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: analysisId }),
      });

      if (!response.ok) {
        throw new Error('共有URLの生成に失敗しました');
      }

      const data = await response.json();
      const url = data.share_url || `${window.location.origin}/share/${data.share_id}`;
      setShareUrl(url);

      await navigator.clipboard.writeText(url);
      setState('copied');

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setState('idle');
      }, 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '共有URLの生成に失敗しました');
      setState('error');
      setTimeout(() => {
        setState('idle');
        setErrorMessage('');
      }, 4000);
    }
  }

  return (
    <div className="relative inline-flex flex-col items-end">
      <button
        onClick={handleShare}
        disabled={state === 'loading'}
        className={`
          inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
          transition-all duration-200
          ${state === 'copied'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : state === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : state === 'loading'
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                : 'bg-white text-[#1B3A5C] border border-[#1B3A5C]/30 hover:bg-[#1B3A5C]/5 hover:border-[#1B3A5C]/50 cursor-pointer'
          }
        `}
      >
        {state === 'loading' ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            生成中...
          </>
        ) : state === 'copied' ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            コピーしました
          </>
        ) : state === 'error' ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            エラー
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            共有URLを生成
          </>
        )}
      </button>

      {/* Share URL display */}
      {shareUrl && state === 'copied' && (
        <div className="mt-2 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="text-xs text-gray-600 bg-transparent outline-none min-w-[200px] font-mono"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(shareUrl);
              setState('copied');
              setTimeout(() => setState('idle'), 2000);
            }}
            className="text-[#1B3A5C] hover:text-[#152e4a] cursor-pointer"
            aria-label="URLをコピー"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <p className="mt-2 text-xs text-red-500" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
