import LangtonLoops from '@/components/Lreplicator';
import Image from 'next/image';
import Boids from '@/components/boids';
import { isAdmin } from '@/lib/auth';
import HomeClient from './HomeClient';

export default async function Home() {
  const admin = await isAdmin();
  return (
    <>
      <Boids />
      <div className="hidden sm:block">
        <LangtonLoops />
      </div>
      <div className="fixed top-4 right-4 z-50 flex flex-col items-center gap-2">
        <Image
          src="/images/pixelated-sami.png"
          alt="Sami"
          width={120}
          height={120}
          className="rounded-lg shadow-lg"
        />
      </div>
      <HomeClient admin={admin} />
    </>
  );
}
