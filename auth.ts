import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import postgres, { Sql } from 'postgres';

const sql: Sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Minimal user fetcher
async function getUser(email: string) {
  const rows = await sql`
    SELECT id, name, email, password
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;
  return rows[0] as
    | { id: string; name: string; email: string; password: string }
    | undefined;
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
          })
          .safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await getUser(email);
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],

  session: { strategy: 'jwt' },
});
