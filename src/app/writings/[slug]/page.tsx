import { notFound } from 'next/navigation';
import Writing from '@/components/writing';
import NavigationButton from '@/components/navigation-button';
import { getAllWritings, getWriting } from '@/lib/data/writings';

export const dynamic = 'force-dynamic';

interface WritingPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const writings = await getAllWritings();
  
  return writings.map((writing) => ({
    slug: writing.slug,
  }));
}

export default async function WritingPage({ params }: WritingPageProps) { 
  const awaitedParams = await params;
  const writingData = await getWriting(awaitedParams.slug);
  
  if (!writingData) {
    notFound();
  }

  return (
    <div>
      <Writing title={writingData.title} content={writingData.content} date={writingData.date} />
      <NavigationButton />
    </div>
  )
}