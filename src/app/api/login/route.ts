import { NextResponse } from 'next/server';
import { getAdminPassword } from '@/lib/secrets';
import { createAdminToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    console.info('[auth] login POST invoked');
    const { password = '' } = await req.json();
    console.info('[auth] login parsed body');
    const adminPassword = (await getAdminPassword()).trim();
    console.info('[auth] login fetched admin password');
    if (password.trim() === adminPassword) {
      const res = NextResponse.json({ success: true });
      const token = await createAdminToken();
      res.cookies.set('adminAuth', token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax'
      });
      console.info('[auth] login success');
      return res;
    }
    console.info('[auth] login password mismatch');
    return NextResponse.json({ success: false }, { status: 401 });
  } catch (error) {
    console.error('[auth] login failed', { error });
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
