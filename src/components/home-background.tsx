'use client';

import dynamic from 'next/dynamic';

const Boids = dynamic(() => import('./boids'), { ssr: false });

export default function HomeBackground() {
  return <Boids />;
}
