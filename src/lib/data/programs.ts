import { ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { getDocClient } from '../dynamodb';
import { ProgramData } from "./types";

export async function getAllPrograms(): Promise<ProgramData[]> {
  const client = getDocClient();
  
  try {
    const command = new ScanCommand({
      TableName: process.env.DYNAMODB_DATA_TABLE_NAME,
      FilterExpression: "begins_with(#pk, :prefix)",
      ExpressionAttributeNames: {
        "#pk": "pk",
      },
      ExpressionAttributeValues: {
        ":prefix": "program#",
      },
    });
    
    const response = await client.send(command);
    
    return (response.Items || []).map(item => ({
      slug: item.slug,
      content: item.content,
      videoName: item.videoName,
      githubUrl: item.githubUrl,
    }));
  } catch (error) {
    console.error("Failed to fetch program:", error);
    return [];
  }
}

export async function getProgram(slug: string): Promise<ProgramData | undefined> {
  const client = getDocClient();
  
  try {
    const command = new GetCommand({
      TableName: process.env.DYNAMODB_DATA_TABLE_NAME,
      Key: {
        pk: `program#${slug}`,
        metadata: "metadata",
      },
    });
    
    const response = await client.send(command);
    
    if (!response.Item) return undefined;
    
    const ret : ProgramData = {
      slug: response.Item.slug,
      content: response.Item.content,
      videoName: response.Item.videoName,
      githubUrl: response.Item.githubUrl,
    };

    return ret;
  } catch (error) {
    console.error(`Failed to fetch program ${slug}:`, error);
    return undefined;
  }
}