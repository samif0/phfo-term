import { NextResponse } from 'next/server';
import { getAdminPassword } from '@/lib/secrets';
import { createAdminToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const adminPassword = await getAdminPassword();
    if (password === adminPassword) {
      const res = NextResponse.json({ success: true });
      const token = await createAdminToken();
      res.cookies.set('adminAuth', token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax'
      });
      return res;
    }
    return NextResponse.json({ success: false }, { status: 401 });
  } catch (error) {
    console.error('login failed', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
