import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { getDocClient } from '@/lib/dynamodb';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get('adminAuth')?.value !== 'true') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const data = await req.json();
  const client = getDocClient();
  const command = new PutCommand({
    TableName: process.env.DYNAMODB_DATA_TABLE_NAME,
    Item: {
      '{contentType}#{slug}': `program#${data.slug}`,
      metadata: 'metadata',
      slug: data.slug,
      content: data.content,
      videoName: data.videoName,
      githubUrl: data.githubUrl,
    },
  });
  await client.send(command);
  return NextResponse.json({ success: true });
}
