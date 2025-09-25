import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { getDocClient } from '@/lib/dynamodb';
import { getDataTableName } from '@/lib/data/table';

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const data = await req.json();
  const client = getDocClient();
  const command = new PutCommand({
    TableName: getDataTableName(),
    Item: {
      '{contentType}#{slug}': `writing#${data.slug}`,
      metadata: 'metadata',
      slug: data.slug,
      title: data.title,
      content: data.content,
      date: data.date || new Date().toISOString().split('T')[0],
    },
  });
  await client.send(command);
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const data = await req.json();
  const client = getDocClient();
  const command = new PutCommand({
    TableName: getDataTableName(),
    Item: {
      '{contentType}#{slug}': `writing#${data.slug}`,
      metadata: 'metadata',
      slug: data.slug,
      title: data.title,
      content: data.content,
      date: data.date || new Date().toISOString().split('T')[0],
    },
  });
  await client.send(command);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { slug } = await req.json();
  const client = getDocClient();
  const command = new DeleteCommand({
    TableName: getDataTableName(),
    Key: {
      '{contentType}#{slug}': `writing#${slug}`,
      metadata: 'metadata',
    },
  });
  await client.send(command);
  return NextResponse.json({ success: true });
}
