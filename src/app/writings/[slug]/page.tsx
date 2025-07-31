import { notFound } from 'next/navigation';
import Writing from '@/components/writing';
import NavigationButton from '@/components/navigation-button';
import { getWriting } from '@/lib/data/writings';
import Boids from '@/components/boids';

export const dynamic = 'force-dynamic';

interface WritingPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function WritingPage({ params }: WritingPageProps) {
  const { slug } = await params;
  const writingData = await getWriting(slug);
  
  if (!writingData) {
    notFound();
  }

  return (
    <div className="min-h-screen relative">
      <Boids />
      <Writing title={writingData.title} content={writingData.content} date={writingData.date} />
      <NavigationButton />
    </div>
  )
}