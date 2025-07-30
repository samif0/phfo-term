import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import NewThoughtForm from './Form';

export const dynamic = 'force-dynamic';

export default async function NewThoughtPage() {
  const admin = await isAdmin();
  if (!admin) {
    redirect('/login');
  }
  return <NewThoughtForm />;
}
