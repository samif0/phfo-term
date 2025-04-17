'use client';
import { useEffect, useState } from 'react';

export default function BoidProfiler() {
  const [frameTime, setFrameTime] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // @ts-ignore
      const t = window.__lastBoidFrameTime;
      if (typeof t === 'number') setFrameTime(t);
    }, 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed bottom-2 right-2 z-50 bg-black bg-opacity-50 text-xs text-white px-2 py-1 rounded">
      Boid cycle: {frameTime.toFixed(1)} ms
    </div>
  );
}