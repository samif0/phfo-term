import { notFound, redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getProgram } from '@/lib/data/programs';
import EditProgramForm from './Form';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditProgramPage({ params }: Props) {
  const admin = await isAdmin();
  if (!admin) {
    redirect('/login');
  }
  const { slug } = await params;
  const data = await getProgram(slug);
  if (!data) {
    notFound();
  }
  return <EditProgramForm initialData={data} />;
}

