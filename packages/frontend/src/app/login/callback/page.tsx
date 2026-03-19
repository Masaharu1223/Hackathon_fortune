'use client';

import { useEffect, useState } from 'react';
import { parseTokenFromCallback } from '@/lib/auth';

export default function CallbackPage() {
  const [token] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : parseTokenFromCallback(),
  );

  useEffect(() => {
    if (token) {
      window.location.href = '/';
    }
  }, [token]);

  if (!token) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="ui-panel-danger rounded-xl p-6 text-center">
          <p className="text-base font-medium text-danger">
            ログインに失敗しました
          </p>
          <p className="mt-2 text-sm text-danger">
            もう一度お試しください
          </p>
          <a
            href="/login/"
            className="ui-button-primary mt-4 inline-block rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            ログインページへ戻る
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="ui-spinner mb-4 h-10 w-10 animate-spin rounded-full border-4" />
      <p className="text-sm text-content-muted">ログイン処理中...</p>
    </div>
  );
}
