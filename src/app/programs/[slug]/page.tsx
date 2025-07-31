import { notFound } from 'next/navigation';
import NavigationButton from '@/components/navigation-button';
import Program from '@/components/program';
import { getProgram } from '@/lib/data/programs';
import Boids from '@/components/boids';

export const dynamic = 'force-dynamic';

interface ProgramPageProps {
  params: {
    slug: string
  }
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const programData = await getProgram(params.slug);

    
  if (!programData) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <Boids />
      <Program content={programData.content} videoName={programData.videoName} githubUrl={programData.githubUrl} />
      <NavigationButton />
    </div>
  )
}