"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('common');
  const router = useRouter();

  useEffect(() => {
    // 默认重定向到编辑器
    router.push("/editor");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{t('redirecting')}</p>
      </div>
    </div>
  );
}
