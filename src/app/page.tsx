import Button from '@/components/btn';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import LangtonLoops from '@/components/Lreplicator';
import Image from 'next/image';
import Boids from '@/components/boids';

export default function Home() {

  return (
    <>
      <Boids />
      <LangtonLoops />
      <div className="fixed top-4 right-4 z-50">
        <Image 
          src="/images/pixelated-sami.png" 
          alt="Sami" 
          width={120} 
          height={120}
          className="rounded-lg shadow-lg"
        />
      </div>
      <div className="flex flex-col items-center min-h-screen pb-16 md:pb-20">
        <div className="w-full max-w-3xl mt-12 self-start px-4 z-10">
        <div>
          <h1 className="text-3xl font-semibold text-gray-400">hello.</h1>
          <h2 className="mt-2 text-2xl" style={{ color: 'rgba(180, 90, 70, 0.9)' }}>
          software engineer @ AWS | RPI CS &apos;23
          
          </h2> 
          
          <p className="mt-2 text-gray-400">
          self-organizing systems, self-replication, and mechanistic interpretability.
          </p>
          <p className="mt-2 text-gray-400">
          
          </p>
        </div>
      </div>

      {/* Buttons row */}
      <div className="flex flex-row gap-4 md:gap-6 mt-auto">
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
      </div>
    </div>
    </>
  );
}
