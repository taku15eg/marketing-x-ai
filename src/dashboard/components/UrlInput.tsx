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
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`
            flex items-center rounded-xl border-2 bg-white shadow-lg transition-all duration-200
            ${error ? 'border-red-400 shadow-red-100' : 'border-gray-200 focus-within:border-[#1B3A5C] focus-within:shadow-[#1B3A5C]/10'}
          `}
        >
          <div className="flex items-center pl-5 text-gray-400">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError('');
            }}
            placeholder="https://example.com/lp"
            className="flex-1 px-4 py-5 text-lg bg-transparent outline-none placeholder-gray-400 font-['Noto_Sans_JP']"
            disabled={isLoading}
            aria-label="分析するURLを入力"
            aria-invalid={!!error}
            aria-describedby={error ? 'url-error' : undefined}
          />
          <div className="pr-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`
                px-8 py-3 rounded-lg text-white font-bold text-base transition-all duration-200
                font-['Noto_Sans_JP']
                ${isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#1B3A5C] hover:bg-[#152e4a] active:scale-[0.97] cursor-pointer'
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
                '分析開始'
              )}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <p
          id="url-error"
          className="mt-3 text-sm text-red-500 pl-2 font-['Noto_Sans_JP']"
          role="alert"
        >
          {error}
        </p>
      )}

      <p className="mt-4 text-center text-sm text-gray-500 font-['Noto_Sans_JP']">
        URLを入力するだけで、LPの課題分析と改善ブリーフを自動生成します
      </p>
    </div>
  );
}
