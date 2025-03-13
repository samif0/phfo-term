import Link from 'next/link';
import GoBack from '@/components/goback';
import { getAllWritings } from '@/lib/data/writings';
import Button from '@/components/btn';
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon';

export const revalidate = 60;

export default async function WritingsPage() {
  const writings = await getAllWritings();
  
  return (
    <div className="min-h-screen relative">
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        {writings.map((writing) => (
          <Link 
            key={writing.slug}
            href={`/writings/${writing.slug}`} 
            className="text-white hover:text-gray-300"
          >
          <Button text={writing.title} variant="outline" size="medium" icon={<ArrowRightIcon className="h-3 w-3" />} iconPosition="right" />
          </Link>
        ))}
      </div>
      <GoBack />
    </div>
  )
}
