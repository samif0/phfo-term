import Button from '@/components/btn';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen pb-16 md:pb-20">
      <div className="w-full max-w-3xl mt-12 self-start px-4 z-10 flex items-start gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-400">hello.</h1>
          <h2 className="mt-2 text-2xl text-gray-600">
          software engineer @ AWS | RPI CS '23
          
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
        text="writings"
        variant="outline"
        size="medium"
        icon={<ArrowRightIcon className="h-3 w-3" />}
        iconPosition="right"
          />
        </Link>
        <Link href="/thoughts" className="text-white hover:text-gray-300 z-10">
          <Button
        text="thoughts"
        variant="outline"
        size="medium"
        icon={<ArrowRightIcon className="h-3 w-3" />}
        iconPosition="right"
          />
        </Link>
        <Link href="/programs" className="text-white hover:text-gray-300 z-10">
          <Button
        text="programs" variant="outline" size="medium" icon={<ArrowRightIcon className="h-3 w-3" />} iconPosition="right" />
        </Link>
      </div>
    </div>
  );
}
