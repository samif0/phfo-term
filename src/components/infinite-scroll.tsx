'use client';
import { useEffect, useRef } from 'react';

export default function InfiniteScroll() {
  const spacerRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef<number>(0);

  useEffect(() => {
    const spacer = spacerRef.current;
    if (!spacer) return;

    const applyHeight = (height: number) => {
      heightRef.current = height;
      spacer.style.height = `${height}px`;
    };

    const recalcBaseHeight = () => {
      if (typeof window === 'undefined') return;
      const viewportHeight = window.innerHeight;
      if (!viewportHeight) return;
      applyHeight(Math.max(160, viewportHeight / 2));
    };

    const extendHeight = () => {
      if (typeof window === 'undefined') return;
      applyHeight(heightRef.current + window.innerHeight);
    };

    recalcBaseHeight();

    const onScroll = () => {
      if (!spacer) return;
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
        extendHeight();
      }
    };
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', recalcBaseHeight);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', recalcBaseHeight);
    };
  }, []);

  return <div ref={spacerRef} />;
}
