'use client';
import { useEffect, useRef } from 'react';

export default function InfiniteScroll() {
  const spacerRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef<number>(window.innerHeight / 2);

  useEffect(() => {
    const spacer = spacerRef.current;
    if (!spacer) return;
    spacer.style.height = `${heightRef.current}px`;
    const onScroll = () => {
      if (!spacer) return;
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
        heightRef.current += window.innerHeight;
        spacer.style.height = `${heightRef.current}px`;
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return <div ref={spacerRef} />;
}
