import { notFound } from 'next/navigation';
import PlaygroundContainer from '@/components/playground-container';
import { getPlaygroundProgram, getAllPlaygroundPrograms } from '@/lib/playground-registry';

export const revalidate = 60;

interface PlaygroundPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const programs = getAllPlaygroundPrograms();
  
  return programs.map((program) => ({
    slug: program.id,
  }))
}

export default async function PlaygroundPage({ params }: PlaygroundPageProps) { 
  const awaitedParams = await params;
  const program = getPlaygroundProgram(awaitedParams.slug);

  if (!program) {
    notFound();
  }

  return (
    <PlaygroundContainer program={program} />
  )
}