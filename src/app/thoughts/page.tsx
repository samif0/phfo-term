import Link from 'next/link';
import NavigationButton from '@/components/navigation-button';
import { getAllThoughts } from '@/lib/data/thoughts';
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon';
import Button from '@/components/btn';

export const revalidate = 60;

export default async function ThoughtsPage() {

    const thoughts = await getAllThoughts()
    
    // Sort thoughts by date (newest first)
    const sortedThoughts = thoughts.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Get the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Split into recent and previous
    const recentThoughts = sortedThoughts.filter(thought => 
      new Date(thought.date) >= thirtyDaysAgo
    );
    const previousThoughts = sortedThoughts.filter(thought => 
      new Date(thought.date) < thirtyDaysAgo
    );
    
    return (
    <div className="min-h-screen relative">
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 py-16">
        {/* Recent Section */}
        {recentThoughts.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">recent</h2>
            {recentThoughts.map((thought) => (
              <Link 
                key={thought.slug}
                href={`/thoughts/${thought.slug}`} 
              >
                <Button text={`${thought.slug} - ${thought.date}`} variant="outline" size="medium" icon={<ArrowRightIcon className="h-3 w-3" />} iconPosition="right" />
              </Link>
            ))}
          </div>
        )}
        
        {/* Previous Section */}
        {previousThoughts.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">previous</h2>
            {previousThoughts.map((thought) => (
              <Link 
                key={thought.slug}
                href={`/thoughts/${thought.slug}`} 
              >
                <Button text={`${thought.slug} - ${thought.date}`} variant="outline" size="medium" icon={<ArrowRightIcon className="h-3 w-3" />} iconPosition="right" />
              </Link>
            ))}
          </div>
        )}
      </div>
      <NavigationButton />
    </div>
    )    
}