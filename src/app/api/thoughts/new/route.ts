import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createThought } from '@/lib/data/thoughts';

// This route only allows authenticated admin users to create new thoughts.

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { slug, content, date } = await request.json();
  if (!slug || !content || !date) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  try {
    await createThought(slug, content, date);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to create thought' }, { status: 500 });
  }
}
