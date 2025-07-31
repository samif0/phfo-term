import { notFound } from 'next/navigation';
import PlaygroundContainer from '@/components/playground-container';
import { getPlaygroundProgram } from '@/lib/playground-registry';

export const dynamic = 'force-dynamic';

interface PlaygroundPageProps {
  params: {
    slug: string
  }
}


export default async function PlaygroundPage({ params }: PlaygroundPageProps) {
  const program = getPlaygroundProgram(params.slug);

  if (!program) {
    notFound();
  }

  return (
    <PlaygroundContainer program={program} />
  )
}