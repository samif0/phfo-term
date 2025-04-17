import Button from '@/components/btn';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex justify-center items-end min-h-screen pb-16 md:pb-20">
      {/* Container for the row of buttons */}
      <div className="flex flex-row gap-4 md:gap-6"> {/* Use flex-row and gap for horizontal layout */}
        <Link href="/writings" className="text-white hover:text-gray-300 z-10">
          <Button text="writings" variant="outline" size="medium" icon={<ArrowRightIcon className="h-3 w-3" />} iconPosition="right" />
        </Link>
        <Link href="/thoughts" className="text-white hover:text-gray-300 z-10">
          <Button text="thoughts" variant="outline" size="medium" icon={<ArrowRightIcon className="h-3 w-3" />} iconPosition="right" />
        </Link>
        <Link href="/programs" className="text-white hover:text-gray-300 z-10">
          <Button text="programs" variant="outline" size="medium" icon={<ArrowRightIcon className="h-3 w-3" />} iconPosition="right" />
        </Link>
      </div>
    </div>
  );
}
