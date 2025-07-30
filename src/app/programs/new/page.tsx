import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import NewProgramForm from './Form';

export const dynamic = 'force-dynamic';

export default async function NewProgramPage() {
  const admin = await isAdmin();
  if (!admin) {
    redirect('/login');
  }
  return <NewProgramForm />;
}
