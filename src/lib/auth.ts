import { cookies } from 'next/headers';

export async function isAdmin() {
  const cookieStore = await cookies();
  const value = cookieStore.get('adminAuth')?.value;
  return value === 'true';
}
