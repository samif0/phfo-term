import { ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { getDocClient } from '../dynamodb';
import { getDataTableName } from './table';
import { ThoughtData } from "./types";

export async function getAllThoughts(): Promise<ThoughtData[]> {
  const client = getDocClient();

  try {
    const command = new ScanCommand({
      TableName: getDataTableName(),
      FilterExpression: "begins_with(#pk, :prefix)",
      ExpressionAttributeNames: {
        "#pk": "{contentType}#{slug}",
      },
      ExpressionAttributeValues: {
        ":prefix": "thought#",
      },
    });

    const response = await client.send(command);

    return (response.Items || []).map(item => ({
      slug: item.slug,
      content: item.content,
      date: item.date,
    }));
  } catch (error) {
    console.error("Failed to fetch thoughts:", error);
    return [];
  }
}

export async function getThought(slug: string): Promise<ThoughtData | undefined> {
  const client = getDocClient();

  try {
    const command = new GetCommand({
      TableName: getDataTableName(),
      Key: {
        '{contentType}#{slug}': `thought#${slug}`,
        metadata: "metadata",
      },
    });

    const response = await client.send(command);

    if (!response.Item) return undefined;
    
    const ret : ThoughtData = {
      slug: response.Item.slug,
      content: response.Item.content,
      date: response.Item.date,
    };

    return ret;
  } catch (error) {
    console.error(`Failed to fetch thought ${slug}:`, error);
    return undefined;
  }
}
