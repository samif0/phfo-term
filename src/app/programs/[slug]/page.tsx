import { notFound } from 'next/navigation';
import NavigationButton from '@/components/navigation-button';
import Program from '@/components/program';
import { getAllPrograms, getProgram } from '@/lib/data/programs';

export const revalidate = 60;

interface ProgramPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const programs = await getAllPrograms();
  
  return programs.map((program) => ({
    slug: program.slug,
  }))
}

export default async function ProgramPage({ params }: ProgramPageProps) { 
  const awaitedParams = await params;
  const programData = await getProgram(awaitedParams.slug);

    
  if (!programData) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Program content={programData.content} videoName={programData.videoName} githubUrl={programData.githubUrl} />
      <NavigationButton />
    </div>
  )
}