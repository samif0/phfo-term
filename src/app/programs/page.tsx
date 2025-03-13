import Link from 'next/link';
import GoBack from '@/components/goback';
import { getAllPrograms } from '@/lib/data/programs';
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon';
import Button from '@/components/btn';

export const revalidate = 60;

export default async function ProgramsPage() {
    const programs = await getAllPrograms()

    return (
    <div className="min-h-screen relative">
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
      <GoBack />
    </div>
    )    
}