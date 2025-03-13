import Link from 'next/link';
import GoBack from '@/components/goback';
import { getAllPrograms } from '@/lib/data/programs';

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
            className="text-white hover:text-gray-300"
          >
            <p>{program.slug}</p>
          </Link>
        ))}
      </div>
      <GoBack />
    </div>
    )    
}