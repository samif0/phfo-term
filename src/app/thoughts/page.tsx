import Link from 'next/link';
import GoBack from '@/components/goback';
import { getAllThoughts } from '@/lib/data/thoughts';
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon';
import Button from '@/components/btn';

export const revalidate = 60;

export default async function ThoughtsPage() {

    const thoughts = await getAllThoughts()
    return (
    <div className="min-h-screen relative">
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        {thoughts.map((thought) =>  (
          <Link 
            key={thought.slug}
            href={`/thoughts/${thought.slug}`} 
          >
          <Button text={`${thought.slug} - ${thought.date}`} variant="outline" size="medium" icon={<ArrowRightIcon className="h-3 w-3" />} iconPosition="right" />
          </Link>
        ))}
      </div>
      <GoBack />
    </div>
    )    
}