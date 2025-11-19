import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

let cachedPassword: string | undefined;

export async function getAdminPassword(): Promise<string> {
  if (cachedPassword) {
    return cachedPassword;
  }

  const envPassword = process.env.ADMIN_PASSWORD?.trim();
  if (envPassword) {
    cachedPassword = envPassword;
    return envPassword;
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

  let secret: Record<string, string>;
  try {
    secret = JSON.parse(secretString);
  } catch {
    cachedPassword = secretString.trim();
    return cachedPassword;
  }

  const rawPassword =
    secret['ADMIN_PASSWORD'] || secret['ADMIN_PASSWORD_SECRET_NAME'] || secret['password'];
  const password = rawPassword?.trim();
  if (!password) {
    throw new Error('Admin password missing in secret');
  }
  cachedPassword = password;
  return password;
}
