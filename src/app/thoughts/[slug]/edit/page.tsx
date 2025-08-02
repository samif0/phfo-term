import { notFound, redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getThought } from '@/lib/data/thoughts';
import EditThoughtForm from './Form';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditThoughtPage({ params }: Props) {
  const admin = await isAdmin();
  if (!admin) {
    redirect('/login');
  }
  const { slug } = await params;
  const data = await getThought(slug);
  if (!data) {
    notFound();
  }
  return <EditThoughtForm initialData={data} />;
}

