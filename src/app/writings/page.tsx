import Link from 'next/link';
import NavigationButton from '@/components/navigation-button';
import { getAllWritings } from '@/lib/data/writings';
import Button from '@/components/btn';
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon';
import AdminPanel from '@/components/admin-panel';
import Boids from '@/components/boids';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function WritingsPage() {
  const writings = await getAllWritings();
  const admin = await isAdmin();
  
  // Get current date and first day of current month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Sort writings by date (newest first)
  const sortedWritings = writings.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Separate writings into this month and previous
  const thisMonthWritings = sortedWritings.filter(writing => 
    new Date(writing.date) >= firstDayOfMonth
  );
  
  const previousWritings = sortedWritings.filter(writing => 
    new Date(writing.date) < firstDayOfMonth
  );
  
  return (
    <div className="min-h-screen relative">
      <Boids />
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 py-12">
        {/* This Month Section */}
        {thisMonthWritings.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold mb-2">recent</h2>
            {thisMonthWritings.map((writing) => (
              <Link 
                key={writing.slug}
                href={`/writings/${writing.slug}`} 
                className="hover:opacity-70 transition-opacity"
              >
                <Button text={writing.title} variant="outline" size="medium" icon={<ArrowRightIcon className="h-3 w-3" />} iconPosition="right" />
              </Link>
            ))}
          </div>
        )}
        
        {/* Divider */}
        {thisMonthWritings.length > 0 && previousWritings.length > 0 && (
          <div className="w-64 h-px bg-gray-600" />
        )}
        
        {/* Previous Posts Section */}
        {previousWritings.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold mb-2">previous</h2>
            {previousWritings.map((writing) => (
              <Link
                key={writing.slug}
                href={`/writings/${writing.slug}`}
                className="hover:opacity-70 transition-opacity"
              >
                <Button text={writing.title} variant="outline" size="medium" icon={<ArrowRightIcon className="h-3 w-3" />} iconPosition="right" />
              </Link>
            ))}
          </div>
        )}
      </div>
      {admin && <AdminPanel addHref="/writings/new" />}
      <NavigationButton />
    </div>
  )
}
