import { notFound } from 'next/navigation';
import Thought from '@/components/thought';
import { getAllThoughts } from '@/data/thoughts-data';
import { getThought } from '@/data/thoughts-data';
import GoBack from '@/components/goback';

interface ThoughtPageProps {
  params: Promise<{
    slug: string
  }>
}


export function generateStaticParams() {
  const thoughts = getAllThoughts();
  
  return thoughts.map((thought) => ({
    slug: thought.slug,
  }));
}

export default async function ThoughtPage({ params }: ThoughtPageProps) { 
  const awaitedParams = await params;
  const thoughtData = getThought(awaitedParams.slug);
  
  if (!thoughtData) {
    notFound();
  }

  return (
    <div>
      <Thought content={thoughtData.content} date={thoughtData.date} />
      <GoBack />
    </div>
  )
}