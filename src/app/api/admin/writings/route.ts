import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { getDocClient } from '@/lib/dynamodb';

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const data = await req.json();
  const client = getDocClient();
  const command = new PutCommand({
    TableName: process.env.DYNAMODB_DATA_TABLE_NAME,
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
