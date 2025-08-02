import { notFound } from 'next/navigation';
import Writing from '@/components/writing';
import NavigationButton from '@/components/navigation-button';
import { getWriting } from '@/lib/data/writings';
import Boids from '@/components/boids';
import { isAdmin } from '@/lib/auth';
import AdminPanel from '@/components/admin-panel';

export const dynamic = 'force-dynamic';

interface WritingPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function WritingPage({ params }: WritingPageProps) {
  const { slug } = await params;
  const writingData = await getWriting(slug);
  const admin = await isAdmin();
  
  if (!writingData) {
    notFound();
  }

  return (
    <div className="min-h-screen relative">
      <Boids />
      <Writing title={writingData.title} content={writingData.content} date={writingData.date} />
      {admin && (
        <AdminPanel editHref={`/writings/${slug}/edit`} deleteEndpoint="/api/admin/writings" deleteSlug={slug} />
      )}
      <NavigationButton />
    </div>
  )
}