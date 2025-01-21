import { notFound } from 'next/navigation';
import Writing from '@/components/writing';
import { getAllWritings } from '@/data/writings-data';
import { getWriting } from '@/data/writings-data';
import GoBack from '@/components/goback';

interface WritingPageProps {
  params: Promise<{
    slug: string
  }>
}


export function generateStaticParams() {
  const writings = getAllWritings();
  
  return writings.map((writing) => ({
    slug: writing.slug,
  }));
}

export default async function WritingPage({ params }: WritingPageProps) { 
  const awaitedParams = await params;
  const writingData = getWriting(awaitedParams.slug);
  
  if (!writingData) {
    notFound();
  }

  return (
    <div>
      <Writing title={writingData.title} content={writingData.content} date={writingData.date} />
      <GoBack />
    </div>
  )
}