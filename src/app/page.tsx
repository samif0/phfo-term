import Button from '@/components/btn';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen gap-4">

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
  );
}
