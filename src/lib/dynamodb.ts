import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let ddbDocClient: ReturnType<typeof DynamoDBDocumentClient.from>;


export function getDocClient() {
  if (!ddbDocClient) {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    console.log("client:", client);

    ddbDocClient = DynamoDBDocumentClient.from(client);
  }
  
  return ddbDocClient;
}