import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

let secretsClient: SecretsManagerClient | undefined;
let cachedAdminPassword: string | undefined;

/**
 * Lazily initialize the AWS Secrets Manager client using the same
 * credentials and region as our DynamoDB connection.
 */
function getClient() {
  if (!secretsClient) {
    secretsClient = new SecretsManagerClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return secretsClient;
}

/**
 * Retrieve the admin password from AWS Secrets Manager. The secret name
 * must be provided via `ADMIN_PASSWORD_SECRET_NAME`.
 * The value is cached after the first request to avoid extra network calls.
 */
export async function getAdminPassword(): Promise<string | undefined> {
  if (cachedAdminPassword !== undefined) return cachedAdminPassword;
  const secretName = process.env.ADMIN_PASSWORD_SECRET_NAME;
  if (!secretName) return undefined;

  const client = getClient();
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  cachedAdminPassword = response.SecretString;
  return cachedAdminPassword;
}

