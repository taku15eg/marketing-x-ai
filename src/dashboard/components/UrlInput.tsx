'use client';

import { useState, type FormEvent } from 'react';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
}

export default function UrlInput({ onSubmit, isLoading = false }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  function validateUrl(value: string): string | null {
    if (!value.trim()) {
      return 'URLを入力してください';
    }

    try {
      const parsed = new URL(value.startsWith('http') ? value : `https://${value}`);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return 'http:// または https:// で始まるURLを入力してください';
      }
      if (!parsed.hostname.includes('.')) {
        return '有効なドメインを入力してください';
      }
      return null;
    } catch {
      return '有効なURLを入力してください（例: https://example.com）';
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const validationError = validateUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    onSubmit(normalizedUrl);
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`
            flex items-center rounded-2xl border-2 bg-white transition-all duration-200
            ${error
              ? 'border-red-400 shadow-lg shadow-red-100'
              : 'border-[#E5E7EB] shadow-lg shadow-black/5 focus-within:border-[#2563EB] focus-within:shadow-[#2563EB]/10'
            }
          `}
          style={{ padding: '6px 6px 6px 20px' }}
        >
          <svg
            className="w-5 h-5 text-[#9CA3AF] flex-shrink-0 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" strokeWidth={2} />
            <path d="M21 21l-4.35-4.35" strokeWidth={2} strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError('');
            }}
            placeholder="https://example.com"
            className="flex-1 py-4 text-base bg-transparent outline-none placeholder-[#9CA3AF] text-[#111827]"
            disabled={isLoading}
            autoFocus
            aria-label="改善したいページのURL"
            aria-invalid={!!error}
            aria-describedby={error ? 'url-error' : undefined}
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`
              px-6 py-3 rounded-xl text-white font-semibold text-sm whitespace-nowrap transition-all duration-200
              ${isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.97] cursor-pointer'
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                分析中...
              </span>
            ) : (
              '改善ポイントを見つける'
            )}
          </button>
        </div>
      </form>

      {error && (
        <p
          id="url-error"
          className="mt-3 text-sm text-red-500 pl-2"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
