import { notFound } from 'next/navigation';
import Writing from '@/components/writing';
import { getAllWritings } from '@/data/writings-data';
import { getWriting } from '@/data/writings-data';
import GoBack from '@/components/goback';

interface WritingPageProps {
  params: {
    slug: string
  }
}


export async function generateStaticParams() {
  const writings = getAllWritings(); // You'll need this function to return all possible slugs
  
  return writings.map((writing) => ({
    slug: writing.slug,
  }));
}

export default async function WritingPage({ params }: WritingPageProps) {
  const awaited_params = await params;
  
  const writingData = getWriting(awaited_params.slug);
  
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