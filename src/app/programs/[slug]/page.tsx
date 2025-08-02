import { notFound } from 'next/navigation';
import NavigationButton from '@/components/navigation-button';
import Program from '@/components/program';
import { getProgram } from '@/lib/data/programs';
import Boids from '@/components/boids';
import { isAdmin } from '@/lib/auth';
import AdminPanel from '@/components/admin-panel';

export const dynamic = 'force-dynamic';

interface ProgramPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = await params;
  const programData = await getProgram(slug);
  const admin = await isAdmin();

    
  if (!programData) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <Boids />
      <Program content={programData.content} videoName={programData.videoName} githubUrl={programData.githubUrl} />
      {admin && (
        <AdminPanel editHref={`/programs/${slug}/edit`} deleteEndpoint="/api/admin/programs" deleteSlug={slug} />
      )}
      <NavigationButton />
    </div>
  )
}