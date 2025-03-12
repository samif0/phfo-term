// src/lib/data/thoughts.ts
import { ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { getDocClient } from '../dynamodb';
import { ThoughtData } from "./types";

export async function getAllThoughts(): Promise<ThoughtData[]> {
  const client = getDocClient();
  
  try {
    const command = new ScanCommand({
      TableName: process.env.DYNAMODB_DATA_TABLE_NAME,
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
      TableName: process.env.DYNAMODB_DATA_TABLE_NAME,
      Key: {
        '{contentType}#{slug}': `thought#${slug}`,
        'metadata': "metadata",
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