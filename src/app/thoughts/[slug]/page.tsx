import { notFound } from 'next/navigation';
import Thought from '@/components/thought';
import { getAllThoughts, getThought } from '@/lib/data/thoughts';
import NavigationButton from '@/components/navigation-button';

export const dynamic = 'force-dynamic';

interface ThoughtPageProps {
  params: Promise<{
    slug: string
  }>
}


export async function generateStaticParams() {
  const thoughts = await getAllThoughts();
  
  return thoughts.map((thought) => ({
    slug: thought.slug,
  }));
}

export default async function ThoughtPage({ params }: ThoughtPageProps) { 
  const awaitedParams = await params;
  const thoughtData = await getThought(awaitedParams.slug);
  
  if (!thoughtData) {
    notFound();
  }

  return (
    <div>
      <Thought content={thoughtData.content} date={thoughtData.date} />
      <NavigationButton />
    </div>
  )
}