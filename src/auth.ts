import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import { db } from "@/lib/db";
import type { Role } from "@/lib/domain";
import { loginSchema } from "@/lib/validators";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: parsed.data.email,
          },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const validPassword = await compare(parsed.data.password, user.passwordHash);

        if (!validPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.isActive = user.isActive;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as Role | undefined) ?? "MEMBER";
        session.user.isActive = Boolean(token.isActive);
      }

      return session;
    },
  },
  secret: process.env.AUTH_SECRET || "development-secret-change-me",
};

export function auth() {
  return getServerSession(authOptions);
}
