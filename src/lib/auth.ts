import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAdminPassword } from './secrets';

/**
 * NextAuth configuration used both by the Next.js API route and by
 * `getServerSession` calls. We keep it in one place so the same settings
 * apply everywhere.
 */

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      /**
       * The authorize callback runs during a credential-based login attempt. We
       * fetch the admin password from AWS Secrets Manager and compare it with
       * the password entered by the user. Returning an object authenticates the
       * user; returning null denies access.
       */
      async authorize(credentials) {
        const adminPassword = await getAdminPassword();
        if (credentials?.password && credentials.password === adminPassword) {
          // We return a minimal user object. NextAuth stores the session as a
          // signed JWT using NEXTAUTH_SECRET.
          return { id: 'admin' };
        }
        return null;
      },
    }),
  ],
};
