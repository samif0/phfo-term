import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let ddbDocClient: ReturnType<typeof DynamoDBDocumentClient.from>;

function resolveRegion(): string {
  const rawRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
  const region = rawRegion.trim();
  return region.length > 0 ? region : "us-east-1";
}

export function getDocClient() {
  if (!ddbDocClient) {
    const client = new DynamoDBClient({
      region: resolveRegion(),
    });

    ddbDocClient = DynamoDBDocumentClient.from(client);
  }

  return ddbDocClient;
}
