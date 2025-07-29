import { ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { getDocClient } from '../dynamodb';
import { WritingData } from "./types";

export async function getAllWritings(): Promise<WritingData[]> {
  const client = getDocClient();

  try {
    console.log('Scanning writings table');
    const command = new ScanCommand({
      TableName: process.env.DYNAMODB_DATA_TABLE_NAME,
      FilterExpression: "begins_with(#pk, :prefix)",
      ExpressionAttributeNames: {
        "#pk": "pk",
      },
      ExpressionAttributeValues: {
        ":prefix": "writing#",
      },
    });
    const response = await client.send(command);

    console.log('Scan returned', (response.Items || []).length, 'items');

    return (response.Items || []).map(item => ({
      slug: item.slug,
      title: item.title,
      content: item.content,
      date: item.date,
    }));

  } catch (error) {
    console.error("Failed to fetch thoughts:", error);
    return [];
  }
}

export async function getWriting(slug: string): Promise<WritingData | undefined> {
  const client = getDocClient();

  try {
    console.log(`Getting writing ${slug}`);
    const command = new GetCommand({
      TableName: process.env.DYNAMODB_DATA_TABLE_NAME,
      Key: {
        pk: `writing#${slug}`,
        metadata: "metadata",
      },
    });

    const response = await client.send(command);

    console.log('Get response has item:', Boolean(response.Item));

    if (!response.Item) return undefined;
    
    const ret : WritingData = {
      slug: response.Item.slug,
      title: response.Item.title,
      content: response.Item.content,
      date: response.Item.date,
    };

    return ret;

  } catch (error) {
    console.error(`Failed to fetch writing ${slug}:`, error);
    return undefined;
  }
}