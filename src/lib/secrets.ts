import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

let cachedSecrets: { password: string; tokenSecret?: string } | null = null;

async function loadSecrets() {
  console.info('[auth] loadSecrets invoked');

  if (cachedSecrets) {
    console.info('[auth] loadSecrets returning cached secrets', {
      hasPassword: Boolean(cachedSecrets.password),
      hasTokenSecret: Boolean(cachedSecrets.tokenSecret)
    });
    return cachedSecrets;
  }

  const secretName =
    process.env.ADMIN_PASSWORD_SECRET_NAME || process.env.ADMIN_PASSWORD_SECRET_KEY;

  if (!secretName) throw new Error('ADMIN_PASSWORD_SECRET_NAME or ADMIN_PASSWORD_SECRET_KEY env var not set');

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const command = new GetSecretValueCommand({ SecretId: secretName });

  const response = await client.send(command);
  const secretString = response.SecretString;

  if (!secretString) throw new Error('SecretString missing in secret');

  try {
    const secret = JSON.parse(secretString) as Record<string, string>;
    const password = secret.ADMIN_PASSWORD?.trim() || secret.password?.trim();
    const tokenSecret = secret.ADMIN_TOKEN_SECRET?.trim() || secret.tokenSecret?.trim();

    if (!password) throw new Error('Admin password missing in secret');

    cachedSecrets = { password, tokenSecret };
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin password missing in secret') {
      throw error;
    }

    console.error('[auth] loadSecrets error', {
      stage: 'secretParseFailed',
      secretName,
      region: process.env.AWS_REGION,
      error
    });

    cachedSecrets = { password: secretString.trim() };
  }

  return cachedSecrets;
}

export async function getAdminPassword(): Promise<string> {
  console.info('[auth] getAdminPassword invoked');
  const { password } = await loadSecrets();
  console.info('[auth] getAdminPassword resolved');
  return password;
}

export async function getAdminTokenSecret(): Promise<string> {
  console.info('[auth] getAdminTokenSecret invoked');
  const { password, tokenSecret } = await loadSecrets();
  if (tokenSecret) {
    return tokenSecret;
  }
  return `derived:${password}`;
}
