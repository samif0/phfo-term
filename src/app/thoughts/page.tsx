import Link from 'next/link';
import GoBack from '@/components/goback';
import { getAllThoughts } from '@/data/thoughts-data';

export default async function ThoughtsPage() {

    const thoughts = getAllThoughts()

    return (
    <div className="min-h-screen relative">
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        {thoughts.map((thought) => (
          <Link 
            key={thought.slug}
            href={`/thoughts/${thought.slug}`} 
            className="text-white hover:text-gray-300"
          >
            {thought.date}
          </Link>
        ))}
      </div>
      <GoBack />
    </div>
    )    
}