let cachedSecrets: { passwordHash: string; tokenSecret: string } | null = null;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} env var not set`);
  }
  return value;
}

async function loadSecrets() {
  if (cachedSecrets) {
    return cachedSecrets;
  }

  const passwordHash = requireEnv('ADMIN_PASSWORD_HASH');
  const tokenSecret = requireEnv('ADMIN_TOKEN_SECRET');

  cachedSecrets = {
    passwordHash,
    tokenSecret,
  };

  return cachedSecrets;
}

export async function getAdminPasswordHash(): Promise<string> {
  const { passwordHash } = await loadSecrets();
  return passwordHash;
}

export async function getAdminTokenSecret(): Promise<string> {
  const { tokenSecret } = await loadSecrets();
  return tokenSecret;
}
