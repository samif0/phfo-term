import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

let cachedSecrets: { password: string; tokenSecret?: string } | null = null;

async function loadSecrets() {
  if (cachedSecrets) {
    return cachedSecrets;
  }

  const secretName =
    process.env.ADMIN_PASSWORD_SECRET_NAME || process.env.ADMIN_PASSWORD_SECRET_KEY;

  if (!secretName) {
    console.error('[auth] loadSecrets error', { stage: 'noSecretName', env: process.env });
    throw new Error('ADMIN_PASSWORD_SECRET_NAME or ADMIN_PASSWORD_SECRET_KEY env var not set');
  }

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  const secretString = response.SecretString;

  if (!secretString) {
    console.error('[auth] loadSecrets error', {
      stage: 'noSecretString',
      secretName,
      region: process.env.AWS_REGION
    });
    throw new Error('SecretString missing in secret');
  }

  try {
    const secret = JSON.parse(secretString) as Record<string, string>;
    const password = secret.ADMIN_PASSWORD?.trim() || secret.password?.trim();
    const tokenSecret = secret.ADMIN_TOKEN_SECRET?.trim() || secret.tokenSecret?.trim();

    if (!password) {
      console.error('[auth] loadSecrets error', { stage: 'missingPasswordKey', secretString });
      throw new Error('Admin password missing in secret');
    }

    cachedSecrets = { password, tokenSecret };
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin password missing in secret') {
      throw error;
    }

    cachedSecrets = { password: secretString.trim() };
  }

  console.info('[auth] loaded admin secrets from Secrets Manager', {
    hasPassword: Boolean(cachedSecrets.password),
    hasTokenSecret: Boolean(cachedSecrets.tokenSecret)
  });

  return cachedSecrets;
}

export async function getAdminPassword(): Promise<string> {
  const { password } = await loadSecrets();
  return password;
}

export async function getAdminTokenSecret(): Promise<string> {
  const { password, tokenSecret } = await loadSecrets();

  if (tokenSecret) {
    return tokenSecret;
  }

  console.warn('[auth] ADMIN_TOKEN_SECRET missing in secret; deriving from password');
  return `derived:${password}`;
}
