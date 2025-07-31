import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

let cachedPassword: string | undefined;

export async function getAdminPassword(): Promise<string> {
  if (cachedPassword) {
    return cachedPassword;
  }

  const secretName =
    process.env.ADMIN_PASSWORD_SECRET_NAME ||
    process.env.ADMIN_PASSWORD_SECRET_KEY;
  if (!secretName) {
    throw new Error(
      'ADMIN_PASSWORD_SECRET_NAME or ADMIN_PASSWORD_SECRET_KEY env var not set'
    );
  }

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  const secretString = response.SecretString;
  if (!secretString) {
    throw new Error('SecretString missing in secret');
  }

  const secret = JSON.parse(secretString);
  const password = secret['ADMIN_PASSWORD'];
  if (!password) {
    throw new Error('ADMIN_PASSWORD key missing in secret');
  }
  cachedPassword = password;
  return password;
}
