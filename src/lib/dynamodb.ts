import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let ddbDocClient: ReturnType<typeof DynamoDBDocumentClient.from>;


export function getDocClient() {
  if (!ddbDocClient) {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION,
    });

    ddbDocClient = DynamoDBDocumentClient.from(client);
  }
  
  return ddbDocClient;
}
