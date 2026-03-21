'use client';

import { useEffect, useState } from 'react';
import { getProfile } from '@/lib/api';
import { clearToken, parseTokenFromCallback } from '@/lib/auth';

export default function CallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapUser() {
      const token = parseTokenFromCallback();
      if (!token) {
        if (!cancelled) {
          setError('トークンを取得できませんでした');
        }
        return;
      }

      try {
        await getProfile();
        if (!cancelled) {
          window.location.href = '/';
        }
      } catch (err) {
        clearToken();
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'プロフィール初期化に失敗しました');
        }
      }
    }

    void bootstrapUser();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="ui-panel-danger rounded-xl p-6 text-center">
          <p className="text-base font-medium text-danger">
            ログインに失敗しました
          </p>
          <p className="mt-2 text-sm text-danger">
            {error}
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
      <p className="text-sm text-content-muted">プロフィールを初期化しています...</p>
    </div>
  );
}
