import { NextResponse } from 'next/server';
import { getAdminPassword } from '@/lib/secrets';
import { createAdminToken } from '@/lib/auth';

export async function POST(req: Request) {
  const { password } = await req.json();
  const adminPassword = await getAdminPassword();
  if (password === adminPassword) {
    const res = NextResponse.json({ success: true });
    const token = createAdminToken();
    res.cookies.set('adminAuth', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax'
    });
    return res;
  }
  return NextResponse.json({ success: false }, { status: 401 });
}
