import { NextResponse } from 'next/server';
import { getAdminPassword } from '@/lib/secrets';

export async function POST(req: Request) {
  const { password } = await req.json();
  const adminPassword = await getAdminPassword();
  if (password === adminPassword) {
    const res = NextResponse.json({ success: true });
    res.cookies.set('adminAuth', 'true', { httpOnly: true, path: '/' });
    return res;
  }
  return NextResponse.json({ success: false }, { status: 401 });
}
