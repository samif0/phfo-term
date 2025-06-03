'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function NavigationTracker() {
  const pathname = usePathname();
  const previousPathname = useRef<string>('');

  useEffect(() => {
    // If navigating from home page to another page, set the flag
    if (previousPathname.current === '/' && pathname !== '/') {
      sessionStorage.setItem('cameFromHome', 'true');
    }
    
    // Update the previous pathname for next navigation
    previousPathname.current = pathname;
  }, [pathname]);

  return null;
}