import { notFound } from 'next/navigation';
import Thought from '@/components/thought';
import { getThought } from '@/lib/data/thoughts';
import NavigationButton from '@/components/navigation-button';
import Boids from '@/components/boids';

export const dynamic = 'force-dynamic';

interface ThoughtPageProps {
  params: Promise<{
    slug: string
  }>
}


export default async function ThoughtPage({ params }: ThoughtPageProps) {
  const { slug } = await params;
  const thoughtData = await getThought(slug);
  
  if (!thoughtData) {
    notFound();
  }

  return (
    <div className="min-h-screen relative">
      <Boids />
      <Thought content={thoughtData.content} date={thoughtData.date} />
      <NavigationButton />
    </div>
  )
}