'use client';
import { useEffect, useState } from 'react';

export default function BoidProfiler() {
  const [frameTime, setFrameTime] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // @ts-expect-error __lastBoidFrameTime is not defined in the global scope
      const t = window.__lastBoidFrameTime;
      if (typeof t === 'number') setFrameTime(t);
    }, 500);
    return () => clearInterval(id);
  }, []);

  // sits above the theme toggle; on phones it only crowded the footer
  return (
    <div className="hidden sm:block fixed bottom-16 right-4 z-50 bg-black bg-opacity-50 text-xs text-white px-2 py-1 rounded">
      {frameTime.toFixed(1)} ms
    </div>
  );
}