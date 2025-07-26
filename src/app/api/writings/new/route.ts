import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createWriting } from '@/lib/data/writings';

// This route only allows authenticated admin users to create new writings.

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { slug, title, content, date } = await request.json();
  if (!slug || !title || !content || !date) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  try {
    await createWriting(slug, title, content, date);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to create writing' }, { status: 500 });
  }
}
