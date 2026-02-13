import { NextResponse } from 'next/server';
import { getContentRepository } from '@/lib/content-repository';
import { ensureAdmin } from '@/lib/api/admin-api';
import { validateDeletePayload, validateWritingPayload } from '@/lib/validation/content';

export async function POST(req: Request) {
  const authFailure = await ensureAdmin(req, 'admin:writings');
  if (authFailure) {
    return authFailure;
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = validateWritingPayload(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const repository = getContentRepository();

    const existing = await repository.getBySlug('writing', parsed.value.slug);
    if (existing) {
      return NextResponse.json({ error: 'slug already exists' }, { status: 409 });
    }

    await repository.upsert({
      contentType: 'writing',
      slug: parsed.value.slug,
      title: parsed.value.title,
      content: parsed.value.content,
      date: parsed.value.date,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create writing', { error });
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const authFailure = await ensureAdmin(req, 'admin:writings');
  if (authFailure) {
    return authFailure;
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = validateWritingPayload(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const repository = getContentRepository();
    const existing = await repository.getBySlug('writing', parsed.value.slug);
    if (!existing) {
      return NextResponse.json({ error: 'entry not found' }, { status: 404 });
    }

    await repository.upsert({
      contentType: 'writing',
      slug: parsed.value.slug,
      title: parsed.value.title,
      content: parsed.value.content,
      date: parsed.value.date,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update writing', { error });
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authFailure = await ensureAdmin(req, 'admin:writings');
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
    const existing = await repository.getBySlug('writing', parsed.value.slug);
    if (!existing) {
      return NextResponse.json({ error: 'entry not found' }, { status: 404 });
    }

    await repository.delete('writing', parsed.value.slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete writing', { error });
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
