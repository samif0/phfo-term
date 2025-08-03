'use client';

import dynamic from 'next/dynamic';

const Boids = dynamic(() => import('./boids'), { ssr: false });
const Lreplicator = dynamic(() => import('./Lreplicator'), { ssr: false });

export default function HomeBackground() {
  return (
    <div className="hidden sm:block">
      <Boids />
      <Lreplicator />
    </div>
  );
}
