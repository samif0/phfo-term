import HomeBackground from '@/components/home-background';
import Image from 'next/image';
import { isAdmin } from '@/lib/auth';
import HomeClient from './HomeClient';

export default async function Home() {
  const admin = await isAdmin();
  return (
    <>
      <HomeBackground />
      {/* On phones it scrolls away with the hero instead of covering the text and menu below */}
      <div className="absolute sm:fixed top-4 right-4 z-30 sm:z-50 flex flex-col items-center gap-2">
        <Image
          src="/images/pixelated-sami.png"
          alt="Sami"
          width={120}
          height={180}
          priority
          className="rounded-lg shadow-lg w-24 h-auto sm:w-[120px]"
        />
      </div>
      <HomeClient admin={admin} />
    </>
  );
}
