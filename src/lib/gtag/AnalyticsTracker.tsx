
'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    gtag: (
      command: 'config',
      targetId: string,
      config?: { page_path: string }
    ) => void;
  }
}

export const AnalyticsTracker = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (!GA_ID) {
      return;
    }
    
    // Check if gtag is available
    if (typeof window.gtag !== 'function') {
      return;
    }

    window.gtag('config', GA_ID, {
      page_path: pathname,
    });
    
  }, [pathname]);

  return null;
};
