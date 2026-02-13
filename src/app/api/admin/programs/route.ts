import { NextResponse } from 'next/server';
import { getContentRepository } from '@/lib/content-repository';
import { ensureAdmin } from '@/lib/api/admin-api';
import { validateDeletePayload, validateProgramPayload } from '@/lib/validation/content';

export async function POST(req: Request) {
  const authFailure = await ensureAdmin(req, 'admin:programs');
  if (authFailure) {
    return authFailure;
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = validateProgramPayload(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const repository = getContentRepository();

    const existing = await repository.getBySlug('program', parsed.value.slug);
    if (existing) {
      return NextResponse.json({ error: 'slug already exists' }, { status: 409 });
    }

    await repository.upsert({
      contentType: 'program',
      slug: parsed.value.slug,
      content: parsed.value.content,
      videoName: parsed.value.videoName,
      githubUrl: parsed.value.githubUrl,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create program', { error });
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const authFailure = await ensureAdmin(req, 'admin:programs');
  if (authFailure) {
    return authFailure;
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = validateProgramPayload(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const repository = getContentRepository();
    const existing = await repository.getBySlug('program', parsed.value.slug);
    if (!existing) {
      return NextResponse.json({ error: 'entry not found' }, { status: 404 });
    }

    await repository.upsert({
      contentType: 'program',
      slug: parsed.value.slug,
      content: parsed.value.content,
      videoName: parsed.value.videoName,
      githubUrl: parsed.value.githubUrl,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update program', { error });
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authFailure = await ensureAdmin(req, 'admin:programs');
  if (authFailure) {
    return authFailure;
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = validateDeletePayload(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const repository = getContentRepository();
    const existing = await repository.getBySlug('program', parsed.value.slug);
    if (!existing) {
      return NextResponse.json({ error: 'entry not found' }, { status: 404 });
    }

    await repository.delete('program', parsed.value.slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete program', { error });
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
