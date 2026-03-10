'use client';

import { Component, type ReactNode } from 'react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="rounded-xl border border-red-200 bg-red-50 p-8">
            <h2 className="text-xl font-bold text-red-800 mb-2">
              予期しないエラーが発生しました
            </h2>
            <p className="text-sm text-red-600 mb-6">
              ページの表示中にエラーが発生しました。ページを再読み込みするか、トップページからやり直してください。
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => this.setState({ hasError: false })}
                className="rounded-lg border border-red-300 bg-white px-5 py-2 text-sm font-medium text-red-700 hover:bg-red-50 cursor-pointer"
              >
                再読み込み
              </button>
              <Link
                href="/"
                className="rounded-lg bg-[#1B3A5C] px-5 py-2 text-sm font-medium text-white hover:bg-[#2A5580]"
              >
                トップに戻る
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
