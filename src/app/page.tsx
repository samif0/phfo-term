import Button from '@/components/btn';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import LangtonLoops from '@/components/Lreplicator';
import Image from 'next/image';
import Boids from '@/components/boids';
import { isAdmin } from '@/lib/auth';

export default async function Home() {
  const admin = await isAdmin();

  return (
    <>
      <div className="hidden sm:block">
        <Boids />
        <LangtonLoops />
      </div>
      <div className="sm:fixed sm:top-4 sm:right-4 z-50 flex flex-col items-center gap-2 mt-4 sm:mt-0">
        <Image
          src="/images/pixelated-sami.png"
          alt="Sami"
          width={120}
          height={120}
          className="rounded-lg shadow-lg"
        />
        {!admin && (
          <Link href="/login">
            <Button text="login" variant="outline" size="small" />
          </Link>
        )}
      </div>
      <div className="flex flex-col items-center min-h-screen pb-16 md:pb-20">
        <nav className="sticky top-0 w-full bg-background/80 backdrop-blur-sm flex justify-center gap-4 py-2 z-40">
          <Link href="/writings" className="text-white hover:text-gray-300 z-10">
            <Button
              text={
                <>
                  <span className="hidden md:inline">writings</span>
                  <span className="inline md:hidden">writ.</span>
                </>
              }
              variant="outline"
              size="medium"
              icon={<ArrowRightIcon className="h-3 w-3" />}
              iconPosition="right"
            />
          </Link>
          <Link href="/thoughts" className="text-white hover:text-gray-300 z-10">
            <Button
              text={
                <>
                  <span className="hidden md:inline">thoughts</span>
                  <span className="inline md:hidden">thou.</span>
                </>
              }
              variant="outline"
              size="medium"
              icon={<ArrowRightIcon className="h-3 w-3" />}
              iconPosition="right"
            />
          </Link>
          <Link href="/programs" className="text-white hover:text-gray-300 z-10">
            <Button
              text={
                <>
                  <span className="hidden md:inline">programs</span>
                  <span className="inline md:hidden">prog.</span>
                </>
              }
              variant="outline"
              size="medium"
              icon={<ArrowRightIcon className="h-3 w-3" />}
              iconPosition="right"
            />
          </Link>
          <Link href="/playground" className="text-white hover:text-gray-300 z-10">
            <Button
              text={
                <>
                  <span className="hidden md:inline">playground</span>
                  <span className="inline md:hidden">play.</span>
                </>
              }
              variant="outline"
              size="medium"
              icon={<ArrowRightIcon className="h-3 w-3" />}
              iconPosition="right"
            />
          </Link>
        </nav>
        <div className="w-full max-w-3xl mt-16 sm:mt-20 px-4 z-10 text-center sm:text-left">
          <h1 className="text-4xl sm:text-5xl font-semibold text-gray-400">hello.</h1>
          <h2 className="mt-2 text-xl sm:text-2xl" style={{ color: 'rgba(180, 90, 70, 0.9)' }}>
            software engineer @ AWS | RPI CS &apos;23
          </h2>
          <p className="mt-4 text-gray-400">
            self-organizing systems, self-replication, and mechanistic interpretability.
          </p>
        </div>
        <section className="max-w-3xl px-4 mt-20 space-y-6 text-gray-400">
          <p>
            welcome to my corner of the internet. more content will gradually
            fill this page as i figure out what belongs here.
          </p>
          <p>
            in the meantime, explore the links above or check back soon for new
            thoughts and programs.
          </p>
        </section>
      </div>
    </>
  );
}
