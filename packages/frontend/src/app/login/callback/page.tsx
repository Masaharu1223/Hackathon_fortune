'use client';

import { useEffect, useState } from 'react';
import { parseTokenFromCallback } from '@/lib/auth';

export default function CallbackPage() {
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = parseTokenFromCallback();
    if (token) {
      window.location.href = '/';
    } else {
      setError(true);
    }
  }, []);

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="rounded-xl bg-red-50 p-6 text-center">
          <p className="text-base font-medium text-red-700">
            ログインに失敗しました
          </p>
          <p className="mt-2 text-sm text-red-500">
            もう一度お試しください
          </p>
          <a
            href="/login/"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            ログインページへ戻る
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      <p className="text-sm text-gray-500">ログイン処理中...</p>
    </div>
  );
}
