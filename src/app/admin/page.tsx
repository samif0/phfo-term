import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminForms from './ui';

/**
 * This page is server-rendered. We verify the user's session on the server
 * using `getServerSession`. If the session is missing, the user is redirected
 * to the login page.
 */

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }
  // Authenticated admin users see the form components below.
  return <AdminForms />;
}
