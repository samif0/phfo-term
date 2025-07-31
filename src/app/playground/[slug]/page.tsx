import { notFound } from 'next/navigation';
import PlaygroundContainer from '@/components/playground-container';
import { getPlaygroundProgram } from '@/lib/playground-registry';

export const dynamic = 'force-dynamic';

interface PlaygroundPageProps {
  params: Promise<{
    slug: string
  }>
}


export default async function PlaygroundPage({ params }: PlaygroundPageProps) {
  const { slug } = await params;
  const program = getPlaygroundProgram(slug);

  if (!program) {
    notFound();
  }

  return (
    <PlaygroundContainer program={program} />
  )
}