import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import NewWritingForm from './Form';

export const dynamic = 'force-dynamic';

export default async function NewWritingPage() {
  const admin = await isAdmin();
  if (!admin) {
    redirect('/login');
  }
  return <NewWritingForm />;
}
