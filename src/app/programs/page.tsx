import Link from 'next/link';
import NavigationButton from '@/components/navigation-button';
import { getAllPrograms } from '@/lib/data/programs';
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon';
import Button from '@/components/btn';
import Boids from '@/components/boids';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ProgramsPage() {
    const programs = await getAllPrograms()
    const admin = await isAdmin();

    return (
    <div className="min-h-screen relative">
      <Boids />
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        {programs.map((program) => (
          <Link 
            key={program.slug}
            href={`/programs/${program.slug}`} 
          >
          <Button text={program.slug} variant="outline" size="medium" icon={<ArrowRightIcon className="h-3 w-3" />} iconPosition="right" />
          </Link>
        ))}
      </div>
      {admin && (
        <div className="mt-4">
          <Link href="/programs/new">
            <Button text="add program" variant="outline" />
          </Link>
        </div>
      )}
      <NavigationButton />
    </div>
    )
}