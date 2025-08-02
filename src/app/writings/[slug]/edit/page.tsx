import { notFound, redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getWriting } from '@/lib/data/writings';
import EditWritingForm from './Form';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditWritingPage({ params }: Props) {
  const admin = await isAdmin();
  if (!admin) {
    redirect('/login');
  }
  const { slug } = await params;
  const data = await getWriting(slug);
  if (!data) {
    notFound();
  }
  return <EditWritingForm initialData={data} />;
}

